import React from "react"

export default function WideButton(props: React.BaseHTMLAttributes<HTMLButtonElement>) {
    const { children: children, className: className, ...otherProps } = props
    return (
        <button className={`${className} w-full px-4 py-2 rounded-full shadow-lg bg-white font-bold`} {...otherProps}>
            {children}
        </button>
    )
}
