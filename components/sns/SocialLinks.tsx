'use client'

import { FaXTwitter, FaLinkedin, FaInstagram, FaYoutube, FaTiktok, FaFacebook } from 'react-icons/fa6'
import { RiLineFill } from 'react-icons/ri'

type SocialLinksProps = {
  variant?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  links: {
    twitter?: string
    linkedin?: string
    line?: string
    instagram?: string
    youtube?: string
    tiktok?: string
    facebook?: string
  }
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export function SocialLinks({ variant = 'horizontal', size = 'md', links }: SocialLinksProps) {
  const platforms = [
    {
      key: 'twitter',
      url: links.twitter,
      Icon: FaXTwitter,
      label: 'X (Twitter)',
      color: 'hover:bg-black',
    },
    {
      key: 'linkedin',
      url: links.linkedin,
      Icon: FaLinkedin,
      label: 'LinkedIn',
      color: 'hover:bg-[#0A66C2]',
    },
    {
      key: 'line',
      url: links.line,
      Icon: RiLineFill,
      label: 'LINE',
      color: 'hover:bg-[#06C755]',
    },
    {
      key: 'instagram',
      url: links.instagram,
      Icon: FaInstagram,
      label: 'Instagram',
      color: 'hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500',
    },
    {
      key: 'youtube',
      url: links.youtube,
      Icon: FaYoutube,
      label: 'YouTube',
      color: 'hover:bg-[#FF0000]',
    },
    {
      key: 'tiktok',
      url: links.tiktok,
      Icon: FaTiktok,
      label: 'TikTok',
      color: 'hover:bg-black',
    },
    {
      key: 'facebook',
      url: links.facebook,
      Icon: FaFacebook,
      label: 'Facebook',
      color: 'hover:bg-[#1877F2]',
    },
  ].filter((p) => p.url && p.url.trim() !== '')

  if (platforms.length === 0) return null

  return (
    <div className={`flex gap-3 ${variant === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}`}>
      {platforms.map(({ key, url, Icon, label, color }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}でフォロー`}
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-neutral-200 ${color} hover:text-white transition-all duration-200`}
        >
          <Icon className={iconSizeClasses[size]} />
        </a>
      ))}
    </div>
  )
}
