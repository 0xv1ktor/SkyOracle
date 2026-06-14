# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
import json


@allow_storage
@dataclass
class Market:
    market_type: str
    city1: str
    city2: str
    lat1: str
    lon1: str
    lat2: str
    lon2: str
    threshold: str
    resolve_date: str
    question: str
    status: str
    winner_side: str
    reasoning: str
    total_yes: u256
    total_no: u256
    creator: Address


@allow_storage
@dataclass
class Bet:
    market_id: u256
    bettor: Address
    side: str
    amount: u256
    claimed: bool
    timestamp: u256


@allow_storage
@dataclass
class LeaderEntry:
    addr: Address
    total_winnings: u256
    total_wagered: u256
    wins: u256
    losses: u256


@gl.evm.contract_interface
class _EOA:
    class View:
        pass
    class Write:
        pass


class SkyOracle(gl.Contract):
    markets: DynArray[Market]
    bets: DynArray[Bet]
    leaderboard: DynArray[LeaderEntry]
    market_count: u256
    bet_count: u256
    platform_fee_bps: u256
    owner: Address
    platform_balance: u256
    min_bet_amount: u256

    def __init__(self):
        self.platform_fee_bps = u256(50)
        self.owner = gl.message.sender_address
        self.min_bet_amount = u256(1000000000000000000)  # 1 GEN

    # ---------- helpers ----------
    def _find_or_create_leader(self, addr: Address) -> int:
        n = len(self.leaderboard)
        for i in range(n):
            if self.leaderboard[i].addr == addr:
                return i
        e = gl.storage.inmem_allocate(
            LeaderEntry,
            addr,
            u256(0), u256(0), u256(0), u256(0),
        )
        self.leaderboard.append(e)
        return n

    # ---------- writes ----------
    @gl.public.write
    def create_market(
        self,
        market_type: str,
        city1: str,
        city2: str,
        lat1: str,
        lon1: str,
        lat2: str,
        lon2: str,
        threshold: str,
        resolve_date: str,
        question: str,
    ) -> u256:
        assert market_type == "rain" or market_type == "temperature" or market_type == "duel", "Invalid market type"
        assert len(city1) > 0, "city1 required"
        assert len(lat1) > 0, "lat1 required"
        assert len(lon1) > 0, "lon1 required"
        assert len(resolve_date) == 10, "resolve_date must be YYYY-MM-DD"

        mid = self.market_count
        m = gl.storage.inmem_allocate(
            Market,
            market_type, city1, city2,
            lat1, lon1, lat2, lon2,
            threshold, resolve_date, question,
            "open", "", "",
            u256(0), u256(0),
            gl.message.sender_address,
        )
        self.markets.append(m)
        self.market_count = self.market_count + u256(1)
        return mid

    @gl.public.write.payable
    def place_bet(self, market_id: u256, side: str) -> None:
        amount = gl.message.value
        assert amount > u256(0), "Must send GEN to bet"
        assert amount >= self.min_bet_amount, "Minimum bet is 1 GEN"

        mid = int(market_id)
        assert mid < int(self.market_count), "Market not found"

        m = self.markets[mid]
        assert str(m.status) == "open", "Market not open"

        mtype = str(m.market_type)
        if mtype == "rain" or mtype == "temperature":
            assert side == "YES" or side == "NO", "Side must be YES or NO"
        else:
            assert side == "CITY1" or side == "CITY2", "Side must be CITY1 or CITY2"

        if side == "YES" or side == "CITY1":
            m.total_yes = m.total_yes + amount
        else:
            m.total_no = m.total_no + amount

        idx = self._find_or_create_leader(gl.message.sender_address)
        self.leaderboard[idx].total_wagered = self.leaderboard[idx].total_wagered + amount

        ts = u256(int(gl.message.timestamp)) if hasattr(gl.message, "timestamp") else u256(0)
        b = gl.storage.inmem_allocate(
            Bet,
            market_id,
            gl.message.sender_address,
            side,
            amount,
            False,
            ts,
        )
        self.bets.append(b)
        self.bet_count = self.bet_count + u256(1)

    @gl.public.write
    def resolve_market(self, market_id: u256) -> str:
        mid = int(market_id)
        assert mid < int(self.market_count), "Market not found"
        m = self.markets[mid]
        assert str(m.status) == "open", "Already resolved or cancelled"

        if int(m.total_yes) == 0 or int(m.total_no) == 0:
            m.status = "resolved"
            m.winner_side = "DRAW"
            m.reasoning = "Only one side had bets, refunding all"
            return "{\"winner\":\"DRAW\",\"reasoning\":\"Only one side had bets, refunding all\"}"

        mtype = str(m.market_type)
        city1 = str(m.city1)
        city2 = str(m.city2)
        lat1 = str(m.lat1)
        lon1 = str(m.lon1)
        lat2 = str(m.lat2)
        lon2 = str(m.lon2)
        threshold = str(m.threshold)
        resolve_date = str(m.resolve_date)
        question = str(m.question)

        def resolve_with_data() -> str:
            if mtype == "duel":
                url1 = "https://api.open-meteo.com/v1/forecast?latitude=" + lat1 + "&longitude=" + lon1 + "&daily=temperature_2m_max&forecast_days=7&timezone=auto"
                url2 = "https://api.open-meteo.com/v1/forecast?latitude=" + lat2 + "&longitude=" + lon2 + "&daily=temperature_2m_max&forecast_days=7&timezone=auto"
                data1 = gl.nondet.web.get(url1).body.decode("utf-8")
                data2 = gl.nondet.web.get(url2).body.decode("utf-8")
                daily1 = json.loads(data1)["daily"]
                daily2 = json.loads(data2)["daily"]
                idx1 = daily1["time"].index(resolve_date)
                idx2 = daily2["time"].index(resolve_date)
                t1 = daily1["temperature_2m_max"][idx1]
                t2 = daily2["temperature_2m_max"][idx2]
                if t1 > t2:
                    winner = "CITY1"
                elif t2 > t1:
                    winner = "CITY2"
                else:
                    winner = "DRAW"
                reasoning = city1 + " temp " + str(t1) + "C vs " + city2 + " temp " + str(t2) + "C"
                return json.dumps({"winner": winner, "reasoning": reasoning}, sort_keys=True)
            elif mtype == "rain":
                url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat1 + "&longitude=" + lon1 + "&daily=precipitation_sum&forecast_days=7&timezone=auto"
                data = gl.nondet.web.get(url).body.decode("utf-8")
                prompt = (
                    "You are a deterministic resolver. Question: " + question +
                    ". City=" + city1 + " Date=" + resolve_date +
                    ". Weather data: " + data +
                    ". RULE: if precipitation_sum on " + resolve_date + " > 1 then winner=YES, else winner=NO."
                    " Reply ONLY valid JSON, no markdown: {\"winner\":\"YES\",\"reasoning\":\"one sentence with actual mm value\"}"
                    " or {\"winner\":\"NO\",\"reasoning\":\"one sentence with actual mm value\"}"
                )
                raw = gl.nondet.exec_prompt(prompt)
                raw = raw.replace("```json", "").replace("```", "").strip()
                return json.dumps(json.loads(raw), sort_keys=True)
            else:
                url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat1 + "&longitude=" + lon1 + "&daily=temperature_2m_max&forecast_days=7&timezone=auto"
                data = gl.nondet.web.get(url).body.decode("utf-8")
                prompt = (
                    "You are a deterministic resolver. Question: " + question +
                    ". City=" + city1 + " Date=" + resolve_date + " Threshold=" + threshold + "C."
                    ". Weather data: " + data +
                    ". RULE: if temperature_2m_max on " + resolve_date + " > " + threshold + " then winner=YES, else winner=NO."
                    " Reply ONLY valid JSON, no markdown: {\"winner\":\"YES\",\"reasoning\":\"one sentence with actual temperature\"}"
                    " or {\"winner\":\"NO\",\"reasoning\":\"one sentence with actual temperature\"}"
                )
                raw = gl.nondet.exec_prompt(prompt)
                raw = raw.replace("```json", "").replace("```", "").strip()
                return json.dumps(json.loads(raw), sort_keys=True)

        result_str = gl.eq_principle.prompt_comparative(
            resolve_with_data,
            "The winner field must be identical (YES/NO/CITY1/CITY2/DRAW)"
        )
        result = json.loads(result_str)
        winner = result.get("winner", "")
        m.status = "resolved"
        m.winner_side = winner
        m.reasoning = result.get("reasoning", "")
        return result_str

    @gl.public.write
    def claim_winnings(self, bet_index: u256) -> u256:
        idx = int(bet_index)
        assert idx < int(self.bet_count), "Bet not found"

        b = self.bets[idx]
        assert b.bettor == gl.message.sender_address, "Not your bet"
        assert not b.claimed, "Already claimed"

        mid = int(b.market_id)
        m = self.markets[mid]
        assert str(m.status) == "resolved", "Market not resolved yet"

        winner_side = str(m.winner_side)
        b.claimed = True

        lb_idx = self._find_or_create_leader(b.bettor)

        if winner_side == "DRAW":
            amount = b.amount
            _EOA(b.bettor).emit_transfer(value=amount)
            return amount

        if str(b.side) != winner_side:
            self.leaderboard[lb_idx].losses = self.leaderboard[lb_idx].losses + u256(1)
            return u256(0)

        total_pool = m.total_yes + m.total_no
        if winner_side == "YES" or winner_side == "CITY1":
            winner_pool = m.total_yes
        else:
            winner_pool = m.total_no

        gross = (b.amount * total_pool) // winner_pool
        fee = (gross * self.platform_fee_bps) // u256(10000)
        payout = gross - fee
        self.platform_balance = self.platform_balance + fee

        if int(payout) > int(b.amount):
            net = payout - b.amount
            self.leaderboard[lb_idx].total_winnings = self.leaderboard[lb_idx].total_winnings + net
        self.leaderboard[lb_idx].wins = self.leaderboard[lb_idx].wins + u256(1)

        _EOA(b.bettor).emit_transfer(value=payout)
        return payout

    @gl.public.write
    def withdraw_fees(self) -> u256:
        assert gl.message.sender_address == self.owner, "Not owner"
        amount = self.platform_balance
        assert amount > u256(0), "Nothing to withdraw"
        self.platform_balance = u256(0)
        _EOA(self.owner).emit_transfer(value=amount)
        return amount

    @gl.public.write
    def cancel_market(self, market_id: u256) -> None:
        mid = int(market_id)
        assert mid < int(self.market_count), "Market not found"
        m = self.markets[mid]
        assert m.creator == gl.message.sender_address or self.owner == gl.message.sender_address, "Not authorized"
        assert str(m.status) == "open", "Cannot cancel"
        assert int(m.total_yes) + int(m.total_no) == 0, "Bets placed"
        m.status = "cancelled"

    # ---------- views ----------
    @gl.public.view
    def get_market(self, market_id: u256) -> dict:
        mid = int(market_id)
        if mid >= int(self.market_count):
            return {}
        m = self.markets[mid]
        return {
            "id": mid,
            "market_type": str(m.market_type),
            "city1": str(m.city1),
            "city2": str(m.city2),
            "lat1": str(m.lat1),
            "lon1": str(m.lon1),
            "lat2": str(m.lat2),
            "lon2": str(m.lon2),
            "threshold": str(m.threshold),
            "resolve_date": str(m.resolve_date),
            "question": str(m.question),
            "status": str(m.status),
            "winner_side": str(m.winner_side),
            "reasoning": str(m.reasoning),
            "total_yes": int(m.total_yes),
            "total_no": int(m.total_no),
            "creator": m.creator.as_hex,
        }

    @gl.public.view
    def get_all_markets(self) -> list:
        result = []
        for i in range(int(self.market_count)):
            result.append(self.get_market(u256(i)))
        return result

    @gl.public.view
    def get_my_bets(self, addr: str) -> list:
        target = Address(addr)
        result = []
        for i in range(int(self.bet_count)):
            b = self.bets[i]
            if b.bettor == target:
                result.append({
                    "bet_index": i,
                    "market_id": int(b.market_id),
                    "bettor": b.bettor.as_hex,
                    "side": str(b.side),
                    "amount": int(b.amount),
                    "claimed": bool(b.claimed),
                    "timestamp": int(b.timestamp),
                })
        return result

    @gl.public.view
    def get_bets_for_market(self, market_id: u256) -> list:
        target_mid = int(market_id)
        result = []
        for i in range(int(self.bet_count)):
            b = self.bets[i]
            if int(b.market_id) == target_mid:
                result.append({
                    "bet_index": i,
                    "market_id": target_mid,
                    "bettor": b.bettor.as_hex,
                    "side": str(b.side),
                    "amount": int(b.amount),
                    "claimed": bool(b.claimed),
                    "timestamp": int(b.timestamp),
                })
        return result

    @gl.public.view
    def get_leaderboard(self) -> list:
        result = []
        for i in range(len(self.leaderboard)):
            e = self.leaderboard[i]
            result.append({
                "addr": e.addr.as_hex,
                "total_winnings": int(e.total_winnings),
                "total_wagered": int(e.total_wagered),
                "wins": int(e.wins),
                "losses": int(e.losses),
            })
        return result

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner.as_hex

    @gl.public.view
    def get_min_bet(self) -> u256:
        return self.min_bet_amount

    @gl.public.view
    def get_market_count(self) -> u256:
        return self.market_count
