import { useState } from 'react';
import { useLocation } from 'wouter';
import { useScrollMemory, goBack } from '@/hooks/useScrollMemory';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, Twitter, Phone, Mail } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// 飞机发送动效按钮
function SendButton({ isPending, label, pendingLabel }: { isPending: boolean; label: string; pendingLabel: string }) {
  return (
    <>
      <style>{`
        .send-btn {
          font-family: inherit;
          font-size: 16px;
          font-weight: 600;
          background: #F5C518;
          color: #0a0f1e;
          padding: 0.75em 1.5em 0.75em 1.2em;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
          cursor: pointer;
          min-height: 52px;
        }
        .send-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .send-btn .svg-wrapper {
          display: flex;
          align-items: center;
        }
        .send-btn span {
          display: block;
          margin-left: 0.45em;
          transition: all 0.3s ease-in-out;
        }
        .send-btn svg {
          display: block;
          transform-origin: center center;
          transition: transform 0.3s ease-in-out;
        }
        .send-btn:not(:disabled):hover .svg-wrapper {
          animation: send-fly 0.6s ease-in-out infinite alternate;
        }
        .send-btn:not(:disabled):hover svg {
          transform: translateX(1.2em) rotate(45deg) scale(1.1);
        }
        .send-btn:not(:disabled):hover span {
          transform: translateX(5em);
        }
        .send-btn:not(:disabled):active {
          transform: scale(0.95);
        }
        @keyframes send-fly {
          from { transform: translateY(0.1em); }
          to   { transform: translateY(-0.1em); }
        }
      `}</style>
      <button type="submit" className="send-btn" disabled={isPending}>
        {isPending ? (
          <span>{pendingLabel}</span>
        ) : (
          <>
            <div className="svg-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20}>
                <path fill="none" d="M0 0h24v24H0z" />
                <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
              </svg>
            </div>
            <span>{label}</span>
          </>
        )}
      </button>
    </>
  );
}

export default function Contact() {
  const { language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();
  useScrollMemory();

  const [platform, setPlatform] = useState('');
  const [accountName, setAccountName] = useState('');
  const [exchangeUid, setExchangeUid] = useState('');
  const [exchangeUsername, setExchangeUsername] = useState('');
  const [message, setMessage] = useState('');

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success(t.form.successMsg);
      setPlatform('');
      setAccountName('');
      setExchangeUid('');
      setExchangeUsername('');
      setMessage('');
    },
    onError: (err) => {
      toast.error(language === 'zh' ? '提交失败，请稍后重试' : 'Submission failed, please try again');
    },
  });

  const texts = {
    zh: {
      nav: { title: '💰 币圈省錢指南', back: '返回上一页' },
      hero: {
        title: '联系我们',
        subtitle: '获取专属手续费折扣',
        desc: '无论您是新用户还是老用户，我们都能为您配置最优惠的返佣方案',
      },
      channels: {
        title: '联系方式',
        subtitle: '选择您最方便的方式联系我们',
        telegram: { name: 'Telegram', handle: '私信咨询', desc: '响应最快，推荐使用' },
        twitter: { name: 'X (Twitter)', handle: '发私信联系', desc: '关注后发送私信' },
        wechat: { name: '微信', handle: '扫码添加', desc: '添加后发送暗号「返佣」' },
        whatsapp: { name: '邮件联系', handle: 'contact@get8.pro', desc: '工作日24小时内回复' },
      },
      form: {
        title: '提交您的信息',
        description: '填写以下信息，我们将在24小时内为您配置返佣',
        platform: '联系平台',
        platformSelect: '请选择联系平台',
        accountName: '您的账号名称',
        accountPlaceholder: '请填写您在该平台的用户名',
        accountExample: '例如：Telegram用户名 @username，微信号 wxid_xxx',
        exchangeUid: '交易所 UID（可选）',
        exchangeUidPlaceholder: '填写您的交易所账户 UID',
        exchangeUsername: '交易所用户名（可选）',
        exchangeUsernamePlaceholder: '填写您的交易所注册用户名',
        message: '备注信息（可选）',
        messagePlaceholder: '其他需要说明的信息，例如您使用的交易所、交易频率等',
        submit: '提交信息',
        submitting: '提交中...',
        privacy: '您的信息仅用于配置返佣，我们承诺保护您的隐私',
        successMsg: '提交成功！我们将尽快与您联系',
        errorMsg: '提交失败',
      },
      platforms: {
        telegram: 'Telegram',
        twitter: 'X (Twitter)',
        wechat: '微信',
        whatsapp: 'WhatsApp',
        other: '其他',
      },
      footer: {
        title: '让每一笔交易都更具价值',
        subtitle: '智慧交易，从省钱开始',
      },
    },
    en: {
      nav: { title: '💰 Crypto Savings Guide', back: 'Back' },
      hero: {
        title: 'Contact Us',
        subtitle: 'Get Exclusive Fee Discounts',
        desc: 'Whether you are a new or existing user, we can configure the best rebate plan for you',
      },
      channels: {
        title: 'Contact Methods',
        subtitle: 'Choose the most convenient way to reach us',
        telegram: { name: 'Telegram', handle: 'Send a DM', desc: 'Fastest response, recommended' },
        twitter: { name: 'X (Twitter)', handle: 'Send a DM', desc: 'Follow us and send a message' },
        wechat: { name: 'WeChat', handle: 'Scan QR Code', desc: 'Send keyword "rebate" after adding' },
        whatsapp: { name: 'Email', handle: 'contact@get8.pro', desc: 'Reply within 24h on business days' },
      },
      form: {
        title: 'Submit Your Information',
        description: 'Fill in the following information and we will configure rebates for you within 24 hours',
        platform: 'Contact Platform',
        platformSelect: 'Please select a contact platform',
        accountName: 'Your Account Name',
        accountPlaceholder: 'Enter your username on that platform',
        accountExample: 'e.g., Telegram @username, WeChat wxid_xxx',
        exchangeUid: 'Exchange UID (Optional)',
        exchangeUidPlaceholder: 'Enter your exchange account UID',
        exchangeUsername: 'Exchange Username (Optional)',
        exchangeUsernamePlaceholder: 'Enter your exchange registered username',
        message: 'Additional Notes (Optional)',
        messagePlaceholder: 'Other information, e.g., exchanges you use, trading frequency, etc.',
        submit: 'Submit Information',
        submitting: 'Submitting...',
        privacy: 'Your information is only used for rebate configuration. We are committed to protecting your privacy.',
        successMsg: 'Submitted successfully! We will contact you soon.',
        errorMsg: 'Submission failed',
      },
      platforms: {
        telegram: 'Telegram',
        twitter: 'X (Twitter)',
        wechat: 'WeChat',
        whatsapp: 'WhatsApp',
        other: 'Other',
      },
      footer: {
        title: 'Make Every Trade More Valuable',
        subtitle: 'Smart Trading Starts with Savings',
      },
    },
  };

  const t = texts[language as keyof typeof texts];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !accountName) {
      toast.error(language === 'zh' ? '请填写必填项' : 'Please fill in required fields');
      return;
    }
    submitContact.mutate({ platform, accountName, exchangeUid, exchangeUsername, message });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4">
          <button onClick={goBack} className="flex items-center gap-1.5 text-accent hover:opacity-80 transition font-bold text-sm">
            ← {t.nav.back}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage('zh')}
              className={`px-3 py-1 rounded text-sm font-medium transition ${language === 'zh' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-accent'}`}
            >
              中文
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded text-sm font-medium transition ${language === 'en' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-accent'}`}
            >
              EN
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-card/30 text-center">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold text-accent mb-4">{t.hero.title}</h1>
          <p className="text-2xl text-white mb-4">{t.hero.subtitle}</p>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.hero.desc}</p>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="py-16 px-4 bg-card/20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-accent text-center">{t.channels.title}</h2>
          <p className="text-muted-foreground mb-10 text-center">{t.channels.subtitle}</p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: <MessageCircle className="text-accent" size={32} />, ...t.channels.telegram, color: 'border-blue-500/30' },
              { icon: <Twitter className="text-accent" size={32} />, ...t.channels.twitter, color: 'border-gray-500/30' },
              { icon: <Phone className="text-accent" size={32} />, ...t.channels.wechat, color: 'border-green-500/30' },
              { icon: <Mail className="text-accent" size={32} />, ...t.channels.whatsapp, color: 'border-accent/30' },
            ].map((ch, i) => (
              <div key={i} className={`bg-card p-6 rounded-xl border ${ch.color} text-center hover:border-accent transition`}>
                <div className="flex justify-center mb-3">{ch.icon}</div>
                <h3 className="font-bold text-white mb-1">{ch.name}</h3>
                <p className="text-accent text-sm font-mono mb-2">{ch.handle}</p>
                <p className="text-muted-foreground text-xs">{ch.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-2 text-accent text-center">{t.form.title}</h2>
          <p className="text-muted-foreground mb-10 text-center">{t.form.description}</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">
                {t.form.platform} <span className="text-accent">*</span>
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">{t.form.platformSelect}</option>
                <option value="telegram">{t.platforms.telegram}</option>
                <option value="x">{t.platforms.twitter}</option>
                <option value="wechat">{t.platforms.wechat}</option>
                <option value="whatsapp">{t.platforms.whatsapp}</option>
                <option value="other">{t.platforms.other}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">
                {t.form.accountName} <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={t.form.accountPlaceholder}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-muted-foreground text-xs mt-2">{t.form.accountExample}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">{t.form.exchangeUid}</label>
              <input
                type="text"
                value={exchangeUid}
                onChange={(e) => setExchangeUid(e.target.value)}
                placeholder={t.form.exchangeUidPlaceholder}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">{t.form.exchangeUsername}</label>
              <input
                type="text"
                value={exchangeUsername}
                onChange={(e) => setExchangeUsername(e.target.value)}
                placeholder={t.form.exchangeUsernamePlaceholder}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">{t.form.message}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={t.form.messagePlaceholder}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
            <SendButton
              isPending={submitContact.isPending}
              label={t.form.submit}
              pendingLabel={t.form.submitting}
            />
            <p className="text-muted-foreground text-xs text-center">{t.form.privacy}</p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card/50 border-t border-border">
        <div className="container mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-4">{t.footer.title}</h3>
          <p className="text-muted-foreground mb-4">{t.footer.subtitle}</p>
          <a href="mailto:contact@get8.pro" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition mb-6 text-sm">
            <Mail size={14} /> contact@get8.pro
          </a>
          <br />
          <button onClick={goBack} className="text-accent hover:text-accent/80 transition flex items-center gap-2 mx-auto">
            <ArrowLeft size={16} /> {t.nav.back}
          </button>
        </div>
      </footer>
    </div>
  );
}
