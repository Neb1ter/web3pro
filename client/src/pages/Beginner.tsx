import { useState, useDeferredValue } from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, ChevronUp, Search, BookOpen, Newspaper, ArrowLeft } from 'lucide-react';
import { useScrollMemory, goBack } from '@/hooks/useScrollMemory';

const CATEGORY_MAP: Record<string, { zh: string; en: string }> = {
  basic:    { zh: '区块链基础', en: 'Blockchain Basics' },
  trading:  { zh: '交易入门',   en: 'Trading Basics' },
  fees:     { zh: '手续费与返佣', en: 'Fees & Rebates' },
  security: { zh: '钱包与安全', en: 'Wallet & Security' },
  other:    { zh: '其他',       en: 'Other' },
};

export default function Beginner() {
  const { language, setLanguage } = useLanguage();
  const zh = language === 'zh';

  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput);
  const [openId, setOpenId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useScrollMemory();

  const ALL_FAQS = [
    { id: 1, category: "basic", questionZh: "什么是区块链？", questionEn: "What is blockchain?", answerZh: "区块链是一种分布式账本技术，数据以区块形式链式存储，具有去中心化、不可篡改的特点。", answerEn: "Blockchain is a distributed ledger technology where data is stored in chained blocks, featuring decentralization and immutability." },
    { id: 2, category: "basic", questionZh: "什么是加密货币？", questionEn: "What is cryptocurrency?", answerZh: "加密货币是基于密码学和区块链技术的数字货币，如比特币（BTC）、以太坊（ETH）等。", answerEn: "Cryptocurrency is digital currency based on cryptography and blockchain technology, such as Bitcoin (BTC) and Ethereum (ETH)." },
    { id: 3, category: "trading", questionZh: "什么是现货交易？", questionEn: "What is spot trading?", answerZh: "现货交易是以当前市场价格直接买卖加密货币，资产立即交割，是最基础的交易方式。", answerEn: "Spot trading is buying and selling cryptocurrencies at current market prices with immediate delivery — the most basic trading method." },
    { id: 4, category: "trading", questionZh: "什么是合约交易？", questionEn: "What is futures trading?", answerZh: "合约交易允许使用杠杆放大收益（也放大亏损），分为永续合约和交割合约，风险较高，新手需谨慎。", answerEn: "Futures trading allows using leverage to amplify gains (and losses), including perpetual and delivery contracts. High risk — beginners should be cautious." },
    { id: 5, category: "fees", questionZh: "什么是手续费返佣？", questionEn: "What is fee rebate?", answerZh: "通过推荐链接注册交易所，推荐人可获得被推荐人交易手续费的一定比例作为返佣，最高可达 60%。", answerEn: "By registering through a referral link, the referrer earns a percentage of the referred user's trading fees as rebate — up to 60%." },
    { id: 6, category: "fees", questionZh: "如何获得最高返佣？", questionEn: "How to get maximum rebate?", answerZh: "通过本站推荐链接注册 Gate.io 可获得高达 60% 的手续费返佣，是目前全行业最高比例。", answerEn: "Register Gate.io through our referral link to get up to 60% fee rebate — the highest rate in the industry." },
    { id: 7, category: "security", questionZh: "什么是钱包私钥？", questionEn: "What is a wallet private key?", answerZh: "私钥是控制加密货币钱包的密码，必须妥善保管，切勿泄露给任何人。丢失私钥意味着永久失去资产。", answerEn: "A private key is the password that controls your crypto wallet. Keep it safe and never share it. Losing it means permanently losing your assets." },
    { id: 8, category: "security", questionZh: "如何防范诈骗？", questionEn: "How to avoid scams?", answerZh: "不轻信\"稳赚不赔\"的项目，不点击陌生链接，不将私钥或助记词告诉任何人，只使用官方渠道。", answerEn: "Never trust \"guaranteed profit\" schemes, avoid clicking unknown links, never share your private key or seed phrase, and only use official channels." },
    { id: 9, category: "other", questionZh: "新手应该从哪里开始？", questionEn: "Where should beginners start?", answerZh: "建议先阅读本站的\"Web3 入圈指南\"了解基础概念，再通过推荐链接注册交易所，从小额现货交易开始练习。", answerEn: "We recommend reading our \"Web3 Guide\" for basics, then registering an exchange through our referral link and starting with small spot trades." },
    { id: 10, category: "other", questionZh: "哪个交易所适合新手？", questionEn: "Which exchange is best for beginners?", answerZh: "Binance 和 OKX 界面友好，适合新手入门；Gate.io 返佣比例最高（60%），适合追求低成本的用户。", answerEn: "Binance and OKX have beginner-friendly interfaces; Gate.io offers the highest rebate (60%), ideal for cost-conscious users." },
  ];
  const faqs = ALL_FAQS.filter(f => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return true;
    return f.questionZh.includes(q) || f.questionEn.toLowerCase().includes(q) || f.answerZh.includes(q) || f.answerEn.toLowerCase().includes(q);
  });
  const isLoading = false;

  const categories = ['all', ...Object.keys(CATEGORY_MAP)];

  const filtered = activeCategory === 'all'
    ? faqs
    : faqs.filter(f => f.category === activeCategory);

  const catLabel = (cat: string) => {
    if (cat === 'all') return zh ? '全部' : 'All';
    return zh ? (CATEGORY_MAP[cat]?.zh ?? cat) : (CATEGORY_MAP[cat]?.en ?? cat);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0A192F 0%, #0d2137 50%, #0A192F 100%)' }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-yellow-500/20 backdrop-blur-md" style={{ background: 'rgba(10,25,47,0.92)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-yellow-400 transition-colors flex-shrink-0">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">{zh ? '返回上一页' : 'Back'}</span>
          </button>
          <h1 className="text-base sm:text-lg font-bold text-yellow-400 flex items-center gap-2 flex-shrink-0">
            <BookOpen size={18} />
            <span>{zh ? '新手问答' : 'Beginner Q&A'}</span>
          </h1>
          {/* Language toggle */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setLanguage('zh')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${language === 'zh' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:text-yellow-400'}`}
            >中文</button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${language === 'en' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:text-yellow-400'}`}
            >EN</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-3">
            <BookOpen className="text-yellow-400" size={28} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">
            {zh ? '新手问答' : 'Beginner Q&A'}
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            {zh ? '币圈基础知识，从零开始学习' : 'Crypto basics, learn from scratch'}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setActiveCategory('all'); }}
            placeholder={zh ? '搜索问题，例如：什么是杠杆...' : 'Search questions, e.g. what is leverage...'}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/60 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none"
            >×</button>
          )}
        </div>

        {/* Category filter (hidden when searching) */}
        {!searchInput && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeCategory === cat
                    ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                    : 'bg-transparent text-gray-400 border-gray-600 hover:border-yellow-500/50 hover:text-yellow-400'
                }`}
              >
                {catLabel(cat)}
              </button>
            ))}
          </div>
        )}

        {/* Search result hint */}
        {searchInput && (
          <p className="text-xs text-gray-500 mb-4">
            {zh
              ? `搜索「${searchInput}」，找到 ${filtered.length} 条结果`
              : `Found ${filtered.length} result(s) for "${searchInput}"`}
          </p>
        )}

        {/* FAQ list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-800/60 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">{zh ? '没有找到相关问题' : 'No results found'}</p>
            <button onClick={() => setSearchInput('')} className="mt-2 text-xs text-yellow-500 hover:text-yellow-300">
              {zh ? '清除搜索' : 'Clear search'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq) => (
              <div
                key={faq.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  openId === faq.id
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : 'border-gray-700/60 bg-gray-800/40 hover:border-yellow-500/30'
                }`}
              >
                <button
                  className="w-full flex items-start justify-between gap-3 p-4 text-left"
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                >
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-xs text-yellow-400 font-medium bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full mb-1.5 mr-2">
                      {catLabel(faq.category)}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-gray-100 leading-snug">
                      {zh ? faq.questionZh : faq.questionEn}
                    </span>
                  </div>
                  <span className="flex-shrink-0 mt-0.5 text-gray-400">
                    {openId === faq.id
                      ? <ChevronUp size={18} className="text-yellow-400" />
                      : <ChevronDown size={18} />}
                  </span>
                </button>
                {openId === faq.id && (
                  <div className="px-4 pb-4 border-t border-yellow-500/20">
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed pt-3">
                      {zh ? faq.answerZh : faq.answerEn}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="my-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/30" />
          <span className="text-xs text-yellow-500/60 font-medium">更多内容</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/30" />
        </div>

        {/* News CTA banner */}
        <Link href="/crypto-news">
          <div className="group cursor-pointer rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent p-4 sm:p-5 hover:border-yellow-500/60 hover:shadow-[0_0_24px_rgba(255,215,0,0.08)] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center group-hover:bg-yellow-500/25 transition-colors">
                <Newspaper className="text-yellow-400" size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-bold text-yellow-300 mb-0.5">
                  📡 {zh ? '想了解最新币圈动态？' : 'Want the latest crypto news?'}
                </p>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  {zh
                    ? '查看实时资讯时间轴，掌握市场行情、政策动向和交易所最新消息'
                    : 'View real-time news timeline — market moves, policy updates, exchange news'}
                </p>
              </div>
              <span className="flex-shrink-0 text-yellow-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </Link>

        {/* Exchange CTA */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/contact" className="w-full py-3 px-4 rounded-xl bg-yellow-500 text-gray-900 text-sm font-bold hover:bg-yellow-400 transition-colors">
              {zh ? '联系我们获取返佣' : 'Contact Us for Rebates'}
          </Link>
          <Link href="/exchanges" className="w-full py-3 px-4 rounded-xl border border-yellow-500/40 text-yellow-400 text-sm font-medium hover:bg-yellow-500/10 transition-colors">
              {zh ? '查看交易所对比' : 'Compare Exchanges'}
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-600 mt-8 pb-4">
          {zh ? '学习是投资的基础，省钱是盈利的开始' : 'Learning is the foundation of investing, saving is the start of profiting'}
        </p>
      </main>
    </div>
  );
}
