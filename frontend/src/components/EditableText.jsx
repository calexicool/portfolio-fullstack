import React from 'react'
import clsx from 'clsx'

export default function EditableText({ value, onChange, admin, as='span', className='' }){
  const Tag = as
  if(!admin) return <Tag className={className}>{value}</Tag>
  return (
    <Tag className={clsx('outline-none ring-0 rounded focus-visible:bg-neutral-900/5 dark:focus-visible:bg-white/10', className)}
         contentEditable suppressContentEditableWarning
         onBlur={(e)=>onChange(e.currentTarget.textContent)}>
      {value}
    </Tag>
  )
}
