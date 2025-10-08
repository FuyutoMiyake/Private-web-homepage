import Link from 'next/link'
import { ComponentPropsWithoutRef } from 'react'
import { VideoEmbed } from './VideoEmbed'

// Custom components for MDX rendering
export const MDXComponents = {
  // Custom components
  VideoEmbed,
  // Headings
  h1: (props: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="text-4xl font-bold mt-8 mb-4 text-neutral-900" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-3xl font-bold mt-8 mb-4 text-neutral-900" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-2xl font-bold mt-6 mb-3 text-neutral-900" {...props} />
  ),
  h4: (props: ComponentPropsWithoutRef<'h4'>) => (
    <h4 className="text-xl font-bold mt-6 mb-3 text-neutral-900" {...props} />
  ),
  h5: (props: ComponentPropsWithoutRef<'h5'>) => (
    <h5 className="text-lg font-bold mt-4 mb-2 text-neutral-900" {...props} />
  ),
  h6: (props: ComponentPropsWithoutRef<'h6'>) => (
    <h6 className="text-base font-bold mt-4 mb-2 text-neutral-900" {...props} />
  ),

  // Paragraphs
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p className="mb-4 leading-relaxed text-neutral-700" {...props} />
  ),

  // Lists
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc list-inside mb-4 space-y-2 text-neutral-700" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 text-neutral-700" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li className="ml-4" {...props} />
  ),

  // Links
  a: (props: ComponentPropsWithoutRef<'a'>) => {
    const href = props.href || ''
    const isExternal = href.startsWith('http')

    if (isExternal) {
      return (
        <a
          className="text-blue-600 hover:text-blue-800 underline transition-colors"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      )
    }

    return (
      <Link
        href={href}
        className="text-blue-600 hover:text-blue-800 underline transition-colors"
      >
        {props.children}
      </Link>
    )
  },

  // Code
  code: (props: ComponentPropsWithoutRef<'code'>) => (
    <code
      className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    />
  ),
  pre: (props: ComponentPropsWithoutRef<'pre'>) => (
    <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto mb-4" {...props} />
  ),

  // Blockquote
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className="border-l-4 border-neutral-300 pl-4 py-2 my-4 italic text-neutral-600"
      {...props}
    />
  ),

  // Table
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full divide-y divide-neutral-200" {...props} />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th className="px-4 py-2 bg-neutral-100 text-left text-sm font-semibold text-neutral-900" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td className="px-4 py-2 text-sm text-neutral-700 border-t border-neutral-200" {...props} />
  ),

  // Horizontal rule
  hr: (props: ComponentPropsWithoutRef<'hr'>) => (
    <hr className="my-8 border-neutral-300" {...props} />
  ),

  // Images
  img: (props: ComponentPropsWithoutRef<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="rounded-lg my-4 max-w-full h-auto"
      alt={props.alt || ''}
      {...props}
    />
  ),
}
