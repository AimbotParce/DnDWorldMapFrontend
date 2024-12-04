import React from "react"

export default function SmallButton(props: React.BaseHTMLAttributes<HTMLButtonElement>) {
    const { children: children, className: className, ...otherProps } = props
    return (
        <button className={`${className} px-4 py-1 rounded-full shadow-lg bg-white font-bold`} {...otherProps}>
            {children}
        </button>
    )
}
