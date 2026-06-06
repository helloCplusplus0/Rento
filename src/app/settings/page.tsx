import { SettingsPage as SettingsPageContent } from '@/components/pages/SettingsPage'

export default function SettingsPage() {
  return (
    <SettingsPageContent
      appVersion={process.env.NEXT_PUBLIC_APP_VERSION || '未配置版本号'}
    />
  )
}
