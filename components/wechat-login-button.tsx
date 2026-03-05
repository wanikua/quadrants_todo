'use client'

import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'

/**
 * WeChat Login Button
 * Redirects to /api/auth/wechat which handles the OAuth flow
 */
export function WeChatLoginButton({ className = '' }: { className?: string }) {
  const { t } = useTranslation()

  const handleWeChatLogin = () => {
    window.location.href = '/api/auth/wechat'
  }

  return (
    <Button
      onClick={handleWeChatLogin}
      variant="outline"
      className={`w-full gap-3 border-[3px] border-black text-black hover:bg-[#07C160] hover:text-white hover:border-[#07C160] rounded-[20px] font-bold text-lg py-6 transition-all duration-300 ${className}`}
    >
      {/* WeChat Icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.3.3 0 00.186-.07l2.034-1.428a.83.83 0 01.58-.16c.837.1 1.694.155 2.543.155h.474c-.163-.539-.252-1.102-.252-1.684 0-3.56 3.374-6.448 7.545-6.448h.323C15.533 4.573 12.43 2.188 8.691 2.188zm-2.6 5.27a.96.96 0 110-1.92.96.96 0 010 1.92zm5.22 0a.96.96 0 110-1.92.96.96 0 010 1.92z"/>
        <path d="M23.748 14.547c0-3.252-3.374-5.89-7.131-5.89-3.992 0-7.128 2.638-7.128 5.89 0 3.253 3.136 5.89 7.128 5.89.704 0 1.39-.078 2.049-.221a.68.68 0 01.472.132l1.645 1.136a.236.236 0 00.148.06c.13 0 .236-.109.236-.243 0-.06-.023-.116-.038-.175l-.312-1.17a.465.465 0 01.172-.527c1.571-1.106 2.759-2.842 2.759-4.882zm-9.397-.828a.78.78 0 110-1.56.78.78 0 010 1.56zm4.532 0a.78.78 0 110-1.56.78.78 0 010 1.56z"/>
      </svg>
      {t('signInWithWeChat')}
    </Button>
  )
}
