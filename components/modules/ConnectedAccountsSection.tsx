

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PlatformIcon from '@/components/common/PlatformIcon';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'next-i18next';

interface ConnectedAccount {
    platform: string;
    name: string;
    connected: boolean;
    email?: string;
}

const ACCOUNTS: ConnectedAccount[] = [
    { platform: 'Google', name: 'Google', connected: true, email: '' }, // 동적으로 채워짐
    { platform: 'Instagram', name: 'Instagram', connected: false },
    { platform: 'Threads', name: 'Threads', connected: false },
    { platform: 'LinkedIn', name: 'LinkedIn', connected: false },
    { platform: 'Twitter', name: 'X (Twitter)', connected: false },
    { platform: 'GitHub', name: 'GitHub', connected: false },
];

interface ConnectedAccountsSectionProps {
    userEmail?: string;
    provider?: string;
}

export default function ConnectedAccountsSection({ userEmail, provider }: ConnectedAccountsSectionProps) {
    const { t } = useTranslation('common');
    const [toast, setToast] = useState<string | null>(null);

    // 현재 로그인된 계정 정보로 업데이트
    const accounts = ACCOUNTS.map(acc => {
        if (acc.platform.toLowerCase() === provider?.toLowerCase()) {
            return { ...acc, connected: true, email: userEmail };
        }
        return acc;
    });

    const handleConnect = (platform: string) => {
        // TODO: 실제 OAuth 연동 구현
        setToast(t('connected_not_ready', { platform }));
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border relative">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-4 right-4 left-4 bg-foreground text-background text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center justify-between z-10"
                    >
                        <span>{toast}</span>
                        <Button variant="ghost" size="icon" onClick={() => setToast(null)} className="ml-2 h-6 w-6 text-background hover:opacity-70">
                            <X size={14} />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <h2 className="text-lg font-semibold text-foreground mb-4">{t('connected_accounts')}</h2>

            <div className="space-y-3">
                {accounts.map((account) => (
                    <div
                        key={account.platform}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${account.connected
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                            : 'bg-muted/50 border-border hover:border-muted-foreground/30'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${account.connected ? 'bg-background' : 'bg-muted'
                                }`}>
                                <PlatformIcon platform={account.platform} size={20} />
                            </div>
                            <div>
                                <p className={`font-medium ${account.connected ? 'text-foreground' : 'text-muted-foreground'
                                    }`}>
                                    {account.name}
                                </p>
                                {account.connected && account.email && (
                                    <p className="text-xs text-green-600 dark:text-green-400">{account.email}</p>
                                )}
                            </div>
                        </div>

                        {account.connected ? (
                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium">
                                <Check size={16} />
                                <span>{t('connected')}</span>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConnect(account.platform)}
                                className="gap-1.5"
                            >
                                <Plus size={14} />
                                <span>{t('connect')}</span>
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
                {t('connected_accounts_desc')}
            </p>
        </div>
    );
}
