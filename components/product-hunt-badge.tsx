"use client"

import React, { useEffect, useState } from "react"

export function ProductHuntBadge() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Small delay to ensure it doesn't conflict with initial page load animations
        const timer = setTimeout(() => {
            setIsVisible(true)
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    if (!isVisible) return null

    return (
        <div className="fixed bottom-4 right-4 z-[100] md:bottom-8 md:right-8 opacity-0 animate-slide-up">
            <a
                href="https://www.producthunt.com/products/quadrants-simplest-todo-management-app?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-quadrants-simplest-todo-management-app"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-transform hover:scale-105 active:scale-95"
            >
                <img
                    src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1058175&theme=light&t=1767542487815"
                    alt="Quadrants: Simplest todo management app - Stop organizing. Start doing. | Product Hunt"
                    style={{ width: "250px", height: "54px" }}
                    width="250"
                    height="54"
                />
            </a>
        </div>
    )
}
