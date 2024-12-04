import React from "react"

export default function WideAnchor(props: React.BaseHTMLAttributes<HTMLAnchorElement>) {
    const { children: children, className: className, ...otherProps } = props
    return (
        <a className={`${className} w-full px-4 py-2 rounded-full shadow-lg bg-white font-bold`} {...otherProps}>
            {children}
        </a>
    )
}
