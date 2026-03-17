import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WelcomeGuideProps {
  onClose: () => void;
  onSelectNewUser: () => void;
  onSelectOldUser: () => void;
}

export function WelcomeGuide({ onClose, onSelectNewUser, onSelectOldUser }: WelcomeGuideProps) {
  const { language } = useLanguage();
  const zh = language === 'zh';

  const texts = zh
    ? {
        title: '欢迎，请先选择你的情况',
        subtitle: '我们会把你先带到更适合的返佣路径里。',
        newUser: '我是新用户',
        newUserDesc: '我还没注册，想先拿到默认 20% 返佣，再决定后续怎么做。',
        oldUser: '我是老用户',
        oldUserDesc: '老账户通常无法补绑返佣，我想先看新开账户或更高额度方案。',
        skip: '先自己浏览',
        notice: '目前默认支持 5 家交易所。新用户默认 20% 返佣；需要更高额度或其他平台，直接联系我。',
      }
    : {
        title: 'Welcome, pick your situation first',
        subtitle: 'We will point you to the most useful rebate path first.',
        newUser: "I'm a new user",
        newUserDesc: 'I have not registered yet and want to start with the default 20% rebate.',
        oldUser: "I'm an existing user",
        oldUserDesc: 'Existing accounts usually cannot be retrofitted, so I want a new-account or higher-rate plan.',
        skip: 'Browse on my own',
        notice: 'We currently support 5 exchanges. New users start with a default 20% rebate; contact me for a higher rate or another platform.',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-accent bg-card p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-accent sm:text-3xl">{texts.title}</h2>
            <p className="text-sm text-muted-foreground sm:text-base">{texts.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-target rounded-full p-2 text-muted-foreground transition hover:text-accent"
            aria-label={zh ? '关闭导览' : 'Close guide'}
          >
            <X size={22} />
          </button>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={onSelectNewUser}
            className="tap-target rounded-2xl border border-accent bg-accent/10 p-5 text-left transition hover:bg-accent/20"
          >
            <div className="mb-3 text-lg font-bold text-white">{texts.newUser}</div>
            <p className="text-sm leading-6 text-muted-foreground">{texts.newUserDesc}</p>
          </button>
          <button
            type="button"
            onClick={onSelectOldUser}
            className="tap-target rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-left transition hover:bg-amber-500/15"
          >
            <div className="mb-3 text-lg font-bold text-white">{texts.oldUser}</div>
            <p className="text-sm leading-6 text-muted-foreground">{texts.oldUserDesc}</p>
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-200">
          {texts.notice}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="tap-target w-full rounded-xl border border-border py-3 text-sm text-muted-foreground transition hover:text-accent"
        >
          {texts.skip}
        </button>
      </div>
    </div>
  );
}
