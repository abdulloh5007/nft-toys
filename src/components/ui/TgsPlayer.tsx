"use client";

import React, { useEffect, useRef, useState } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import pako from "pako";

interface TgsPlayerProps {
    src: string;
    className?: string;
    style?: React.CSSProperties;
    unstyled?: boolean;
    cacheKey?: string;
    loop?: boolean;
    autoplay?: boolean;
    playOnHover?: boolean;
}

export const TgsPlayer = React.memo(
    ({ src, className, style, unstyled = false, cacheKey, loop = false, autoplay = true, playOnHover = false }: TgsPlayerProps) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const animationRef = useRef<AnimationItem | null>(null);
        const [animationData, setAnimationData] = useState<object | null>(null);
        const baseClass = unstyled
            ? "group flex items-center justify-center"
            : "group flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200/80 p-2 text-2xl text-neutral-500 transition-all duration-300 hover:bg-neutral-300/50 dark:bg-neutral-800/80 dark:hover:bg-neutral-800/50";
        const wrapperClassName = className ? `${baseClass} ${className}` : baseClass;

        useEffect(() => {
            const fetchAndDecompress = async () => {
                try {
                    const storageKey = cacheKey || `tgs-cache:${src}`;
                    if (typeof window !== "undefined") {
                        const cached = window.sessionStorage.getItem(storageKey);
                        if (cached) {
                            setAnimationData(JSON.parse(cached));
                            return;
                        }
                    }

                    const response = await fetch(src);
                    const compressed = await response.arrayBuffer();
                    const json = pako.inflate(new Uint8Array(compressed), {
                        to: "string",
                    });
                    setAnimationData(JSON.parse(json));

                    if (typeof window !== "undefined") {
                        try {
                            window.sessionStorage.setItem(storageKey, json);
                        } catch {
                            // Quota exceeded - clear old cache and skip caching
                            console.warn("TGS cache quota exceeded, skipping cache");
                        }
                    }
                } catch (err) {
                    console.error("TGS parse error:", err);
                }
            };
            fetchAndDecompress();
        }, [src, cacheKey]);

        useEffect(() => {
            if (!animationData || !containerRef.current) return;

            // Initialize with autoplay: false so we control it via observer
            animationRef.current = lottie.loadAnimation({
                container: containerRef.current,
                renderer: "canvas",
                loop: loop,
                autoplay: false,
                animationData,
            });

            // "Smart" Vision Zone Observer
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && autoplay) {
                            animationRef.current?.play();
                        } else {
                            animationRef.current?.pause();
                        }
                    });
                },
                {
                    threshold: 0.2, // Must be 20% visible
                    rootMargin: '-10% 0px -10% 0px' // "Central place" vision zone (cuts off top/bottom 10%)
                }
            );

            observer.observe(containerRef.current);

            return () => {
                observer.disconnect();
                animationRef.current?.destroy();
            };
        }, [animationData, loop, autoplay]);


        const handleMouseEnter = () => {
            if (playOnHover && animationRef.current) {
                animationRef.current.goToAndPlay(0);
            }
        };

        if (!animationData) {
            return <div className={`${wrapperClassName} animate-pulse`} />;
        }

        return (
            <div
                className={wrapperClassName}
                onMouseEnter={handleMouseEnter}
            >
                <div
                    ref={containerRef}
                    style={style}
                    className="flex h-full w-full items-center justify-center"
                />
            </div>
        );
    }
);

TgsPlayer.displayName = "TgsPlayer";
