import React from "react"

export default function WideAnchor(props: React.BaseHTMLAttributes<HTMLAnchorElement>) {
    const { children: children, className: className, ...otherProps } = props
    return (
        <a
            className={`${className} w-full px-4 py-2 rounded-xl shadow-lg border border-gray-300 font-bold`}
            {...otherProps}
        >
            {children}
        </a>
    )
}
