import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { Wallet, Pickaxe, Coins, Users, Lock, ExternalLink, Timer, ShieldCheck, Copy, CheckCircle, Info, Clock, Zap, Cpu, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const CONTRACT_ADDRESS = "0x0B942B00DE0467358E0E9b4BFb5A8CE85cab42F8"; 
const BSC_CHAIN_ID_HEX = "0x38"; 

const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function mine(address _referrer) public",
  "function stake(uint256 amount) public",
  "function withdrawStake() public",
  "function claimStakeReward() public",
  "function lastMined(address) view returns (uint256)",
  "function stakedAmount(address) view returns (uint256)",
  "function calculateReward(address user) view returns (uint256)",
  "function miningReward() view returns (uint256)",
  "function totalSupply() view returns (uint256)"
];

export default function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [staked, setStaked] = useState("0");
  const [reward, setReward] = useState("0");
  const [total, setTotal] = useState("0");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0); 
  const [timeLeft, setTimeLeft] = useState("");
  const [stakeInput, setStakeInput] = useState("");

  const queryParams = new URLSearchParams(window.location.search);
  const urlReferrer = queryParams.get("ref") || "0x0000000000000000000000000000000000000000";

  const launchConfetti = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00d2ff', '#3a7bd5', '#ffffff'] });
  };

  useEffect(() => {
    if (cooldownTime === 0) return;
    const interval = setInterval(() => {
      const diff = (Number(cooldownTime) + 86400) - Math.floor(Date.now() / 1000);
      if (diff <= 0) { setTimeLeft(""); clearInterval(interval); } 
      else {
        const h = Math.floor(diff / 3600); const m = Math.floor((diff % 3600) / 60); const s = diff % 60;
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownTime]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask!");
    setLoading(true);
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_CHAIN_ID_HEX }] });
      const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accs[0]); fetchData(accs[0]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchData = async (acc) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const [bal, stk, rew, ttl, last] = await Promise.all([
        contract.balanceOf(acc), contract.stakedAmount(acc), contract.calculateReward(acc), contract.totalSupply(), contract.lastMined(acc)
      ]);
      setBalance(ethers.formatEther(bal)); setStaked(ethers.formatEther(stk)); setReward(ethers.formatEther(rew)); setTotal(ethers.formatEther(ttl)); setCooldownTime(last);
    } catch (e) { console.error(e); }
  };

  const handleClaim = async () => {
    if (!account) return connectWallet();
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.claimStakeReward();
      await tx.wait();
      launchConfetti();
      alert("Reward Berhasil Diclaim! 🎉");
      fetchData(account);
    } catch (err) { alert("Gagal Claim: Saldo reward mungkin kosong."); }
    setLoading(false);
  };

  const handleStake = async () => {
    if (!account) return connectWallet();
    if (!stakeInput || stakeInput <= 0) return alert("Masukkan jumlah stake");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const amount = ethers.parseEther(stakeInput);
      const tx = await contract.stake(amount);
      await tx.wait();
      alert("Stake Berhasil!");
      setStakeInput(""); fetchData(account);
    } catch (err) { alert("Gagal Stake: Cek saldo anda."); }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!account) return connectWallet();
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.withdrawStake();
      await tx.wait();
      alert("Saldo Stake Berhasil Ditarik!");
      fetchData(account);
    } catch (err) { alert("Gagal Withdraw."); }
    setLoading(false);
  };

  const handleMine = async () => {
    if (!account) return connectWallet();
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.mine(urlReferrer);
      await tx.wait(); launchConfetti(); fetchData(account);
    } catch (err) { alert("Cooldown aktif atau saldo BNB kurang."); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#000814] text-cyan-50 font-['Orbitron'] p-4 md:p-10 relative overflow-hidden">
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px]"></div>

      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-10 relative z-10">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-cyan-500/20">
            <Cpu className="text-white" size={24} />
          </div>
          <h1 className="text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tighter">RICKY BRUT</h1>
        </div>
        <button onClick={connectWallet} className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-500 transition-all">
          {account ? `${account.slice(0,6)}...` : "CONNECT"}
        </button>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBox title="Balance" val={balance} color="cyan" />
          <StatBox title="Staked" val={staked} color="blue" />
          <StatBox title="Supply" val={total} color="emerald" hideOnMobile={true} />
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] flex flex-col items-center text-center shadow-2xl">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 border border-cyan-400/20">
            {timeLeft ? <Clock size={40} className="text-slate-500" /> : <Pickaxe size={40} className={`text-cyan-400 ${loading ? 'animate-spin' : 'animate-bounce'}`} />}
          </div>
          <h2 className="text-xl font-bold mb-2 text-cyan-400 uppercase tracking-widest">Extractor</h2>
          <p className="text-[10px] text-slate-500 mb-8 uppercase tracking-widest">Mining Reward: 100 BRUT</p>
          <button onClick={handleMine} disabled={loading || timeLeft !== ""} className={`w-full py-4 rounded-xl font-black transition-all ${timeLeft ? 'bg-white/5 text-slate-600' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:scale-105'}`}>
            {loading ? "DATA SYNC..." : (timeLeft || "START EXTRACTION")}
          </button>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-bold flex items-center gap-2 text-blue-400 uppercase tracking-widest"><Zap size={16} /> Receptor</h3>
              <div className="px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 text-[8px] font-bold text-blue-400 tracking-widest">10% APR</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <p className="text-slate-500 text-[9px] tracking-widest mb-2 uppercase">Unclaimed Reward</p>
                <p className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] truncate">{Number(reward).toFixed(6)}</p>
                <button onClick={handleClaim} className="mt-6 text-cyan-400 text-[10px] font-bold flex items-center gap-2 hover:underline uppercase tracking-widest mx-auto md:mx-0">
                  Terminate & Claim <ExternalLink size={12}/>
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input type="number" value={stakeInput} onChange={(e) => setStakeInput(e.target.value)} placeholder="0.0" className="w-full bg-black/40 border border-white/10 p-4 rounded-xl outline-none focus:border-cyan-500/30 transition-all font-black text-center" />
                  <div className="absolute right-4 top-4 text-[10px] font-bold text-slate-600 uppercase">Brut</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleStake} className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-[10px] uppercase hover:bg-slate-200 transition-all">Stake</button>
                  <button onClick={handleWithdraw} className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold text-[10px] uppercase hover:bg-white/10 transition-all">Withdraw</button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-600/10 to-transparent border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Users size={20}/></div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest">Affiliate System</h4>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">RECRUIT OTHERS FOR +20 BRUT UNIT</p>
              </div>
            </div>
            <div className="flex w-full md:w-auto items-center bg-black/60 p-2 rounded-xl border border-white/5">
              <input readOnly value={account ? `${window.location.origin}?ref=${account.slice(0,8)}...` : "OFFLINE"} className="bg-transparent text-[9px] px-4 outline-none text-cyan-400 w-full font-bold uppercase" />
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?ref=${account}`); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="bg-cyan-500 p-3 rounded-lg">
                {copied ? <CheckCircle size={14}/> : <Copy size={14}/>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-row flex-wrap justify-center gap-2 px-4">
  <a 
    href="https://x.com/Ricky_BRUT" target="_blank" 
    className="flex-1 min-w-[80px] py-2 px-2 text-[8px] text-center border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-[#5865F2]"
  >
    ✖️ ( Twitter )
  </a>
  <a 
    href="https://github.com/Ricky-Bruts/ricky-brut-contracts" target="_blank" 
    className="flex-1 min-w-[80px] py-2 px-2 text-[8px] text-center border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white"
  >
    🗒️ CONTRACT
  </a>
  <a 
    href="https://github.com/Ricky-Bruts/ricky-brut-contracts/blob/main/WHITEPAPER.md" target="_blank" 
    className="flex-1 min-w-[80px] py-2 px-2 text-[8px] text-center border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-[#22d3ee]"
  >
    📝 WHITEPAPER
  </a>
</div>

<div className="mt-4 flex justify-center w-full">
  <a 
    href="https://bscscan.com/address/0x0B942B00DE0467358E0E9b4BFb5A8CE85cab42F8" 
    target="_blank" 
    className="px-4 py-1.5 border border-yellow-500/20 rounded-full bg-yellow-500/5 hover:bg-yellow-500/10 transition-all flex items-center gap-2 no-underline"
  >
    <span className="text-[7px] text-yellow-500/80 tracking-widest font-bold">
      VIEW ON BSCSCAN: 0x0B94...42F8
    </span>
    <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></div>
  </a>
</div>

<div className="max-w-[400px] mx-auto mt-8 px-4 space-y-3">
  
  <div className="text-center mb-6 px-2">
    <h2 className="text-lg font-black tracking-tighter text-yellow-500 uppercase">
      Miner King 👑
    </h2>
    <p className="text-[10px] leading-tight text-white/60 mt-1">
      Ricky Brut ($BRUT) adalah ekosistem DeFi revolusioner di jaringan BNB Smart Chain yang menggabungkan mekanisme Daily Mining, Yield Staking, dan Smart Deflationary Tax.
    </p>
  </div>

  <details className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md transition-all">
    <summary className="flex justify-between items-center p-4 cursor-pointer list-none">
      <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">🛠️ CARA BERGABUNG</span>
      <span className="text-cyan-400 group-open:rotate-180 transition-transform text-[10px]">▼</span>
    </summary>
    <div className="px-4 pb-4 pt-0 text-[10px] text-white/70 space-y-2 border-t border-white/5">
      <p>• <b className="text-white">Wallet:</b> Connect MetaMask/Trust Wallet (BSC).</p>
      <p>• <b className="text-white">Start:</b> Klik "START MINING" (Butuh sedikit Gas Fee BNB).</p>
      <p>• <b className="text-white">Stake:</b> Pindahkan BRUT ke Stake Portal.</p>
      <p>• <b className="text-white">Referral:</b> Bagikan link unik untuk bonus.</p>
    </div>
  </details>

  <details className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md transition-all">
    <summary className="flex justify-between items-center p-4 cursor-pointer list-none">
      <span className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase">📈 MEKANISME BRUT</span>
      <span className="text-cyan-400 group-open:rotate-180 transition-transform text-[10px]">▼</span>
    </summary>
    <div className="px-4 pb-4 pt-0 text-[10px] text-white/70 space-y-2 border-t border-white/5">
      <p>Klaim <b className="text-yellow-500">100 BRUT / 24 Jam</b> per dompet.</p>
      <p><b className="text-white underline italic">Halving:</b> Hadiah mining akan dipotong 50% setiap kali suplai baru mencapai kelipatan 500.000 BRUT. Ini mencegah inflasi berlebih di masa depan.</p>
      <a href="https://github.com/Ricky-Bruts/ricky-brut-contracts/blob/main/WHITEPAPER.md" target="_blank" className="text-blue-400 block pt-1">→ Whitepaper</a>
    </div>
  </details>

  <details className="group bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden backdrop-blur-md transition-all">
    <summary className="flex justify-between items-center p-4 cursor-pointer list-none">
      <span className="text-[11px] font-bold tracking-widest text-red-400 uppercase">⚠️ DISCLAIMER</span>
      <span className="text-red-400 group-open:rotate-180 transition-transform text-[10px]">▼</span>
    </summary>
    <div className="px-4 pb-4 pt-0 text-[10px] text-red-200/60 leading-relaxed border-t border-red-500/10">
      <p>Investasi dalam aset kripto memiliki risiko tinggi. Proyek ini saat ini dalam fase akumulasi komunitas. Penambahan likuiditas dijadwalkan pada <b className="text-white">Maret 2027</b>. Lakukan riset mandiri (DYOR) sebelum berpartisipasi.</p>
      <a href="https://github.com/Ricky-Bruts/ricky-brut-contracts/blob/main/README.md" target="_blank" className="text-blue-400 block pt-1">→ README.md</a>
    </div>
  </details>

</div>

      <footer className="max-w-7xl mx-auto mt-16 text-center opacity-30">
        <p className="text-[8px] tracking-[0.5em] font-black uppercase">Ricky Brut Protocol • 2026</p>
      </footer>
    </div>
  );
}

function StatBox({title, val, color, hideOnMobile = false}) {
  const colors = {
    cyan: "text-cyan-400 border-cyan-400/20",
    blue: "text-blue-400 border-blue-400/20",
    emerald: "text-emerald-400 border-emerald-400/20"
  };
  return (
    <div className={`bg-white/5 backdrop-blur-md border p-6 rounded-2xl ${colors[color]} ${hideOnMobile ? 'hidden md:block' : ''}`}>
      <p className="text-[8px] tracking-[0.3em] font-black mb-2 uppercase opacity-50">{title}</p>
      <p className="text-xl font-black truncate tracking-tighter">{Number(val).toLocaleString()}</p>
    </div>
  );
}
