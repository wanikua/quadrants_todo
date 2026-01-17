"use client"

import React, { useEffect, useState } from "react"

export function PeerPushBadge() {
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
                href="https://peerpush.net/p/quadrants-ai-task-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="block transition-transform hover:scale-105 active:scale-95"
                style={{ width: "230px" }}
            >
                <img
                    src="https://peerpush.net/p/quadrants-ai-task-manager/badge.png"
                    alt="Quadrants: AI Task Manager badge"
                    style={{ width: "230px" }}
                />
            </a>
        </div>
    )
}
