// src/features/mentorship/hooks/useInfiniteCarousel.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BUFFER = 3;
const TRANSITION_MS = 500;

export function useInfiniteCarousel(itemCount: number) {
    const [currentIndex, setCurrentIndex] = useState(BUFFER);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [cardWidthPercent, setCardWidthPercent] = useState(100 / 3);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragDistance = useRef(0);
    const isWheelScrolling = useRef(false);

    useEffect(() => {
        const updateWidth = () => {
            if (window.innerWidth < 640) setCardWidthPercent(100);
            else if (window.innerWidth < 1024) setCardWidthPercent(50);
            else setCardWidthPercent(100 / 3);
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const visibleCardsCount = Math.round(100 / cardWidthPercent);
    const shouldCarousel = itemCount > visibleCardsCount;

    const nextSlide = useCallback(() => {
        if (isTransitioning || itemCount === 0) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
        setTimeout(() => {
            setIsTransitioning(false);
            setCurrentIndex((prev) => (prev >= BUFFER + itemCount ? prev - itemCount : prev));
        }, TRANSITION_MS);
    }, [isTransitioning, itemCount]);

    const prevSlide = useCallback(() => {
        if (isTransitioning || itemCount === 0) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
        setTimeout(() => {
            setIsTransitioning(false);
            setCurrentIndex((prev) => (prev <= BUFFER - 1 ? prev + itemCount : prev));
        }, TRANSITION_MS);
    }, [isTransitioning, itemCount]);

    const onDragStart = (clientX: number) => {
        dragDistance.current = 0;
        setTouchStart(clientX);
        setIsDragging(true);
    };

    const onDragMove = (clientX: number) => {
        if (!isDragging || touchStart === null) return;
        dragDistance.current = touchStart - clientX;
    };

    const onDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (Math.abs(dragDistance.current) > 50) {
            if (dragDistance.current > 50) nextSlide();
            else prevSlide();
        }
        setTouchStart(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
        if (isWheelScrolling.current || isTransitioning) return;
        const threshold = 30;
        if (e.deltaX > threshold) {
            isWheelScrolling.current = true;
            nextSlide();
            setTimeout(() => (isWheelScrolling.current = false), 800);
        } else if (e.deltaX < -threshold) {
            isWheelScrolling.current = true;
            prevSlide();
            setTimeout(() => (isWheelScrolling.current = false), 800);
        }
    };

    // Auto play (sirf jab carousel chal raha ho)
    useEffect(() => {
        if (!shouldCarousel || isHovered) return;
        const interval = setInterval(nextSlide, 5000);
        return () => clearInterval(interval);
    }, [shouldCarousel, isHovered, nextSlide]);

    const getClones = <T,>(arr: T[], count: number): T[] => {
        if (arr.length === 0) return [];
        let clones: T[] = [];
        while (clones.length < count) clones = [...clones, ...arr];
        return clones.slice(0, count);
    };

    const buildDisplayItems = <T,>(items: T[]): T[] => {
        if (!shouldCarousel) return items;
        const pre = getClones([...items].reverse(), BUFFER).reverse();
        const post = getClones(items, BUFFER);
        return [...pre, ...items, ...post];
    };

    const containerProps = shouldCarousel
        ? {
              onMouseEnter: () => setIsHovered(true),
              onMouseLeave: () => {
                  setIsHovered(false);
                  if (isDragging) onDragEnd();
              },
              onTouchStart: (e: React.TouchEvent) => onDragStart(e.targetTouches[0].clientX),
              onTouchMove: (e: React.TouchEvent) => onDragMove(e.targetTouches[0].clientX),
              onTouchEnd: () => onDragEnd(),
              onMouseDown: (e: React.MouseEvent) => onDragStart(e.clientX),
              onMouseMove: (e: React.MouseEvent) => onDragMove(e.clientX),
              onMouseUp: () => onDragEnd(),
              onWheel: handleWheel,
          }
        : {};

    const containerClassName = `relative w-full overflow-hidden -mx-2.5 px-2.5 pt-1 pb-4 ${
        shouldCarousel ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
    }`;

    const trackStyle: React.CSSProperties = shouldCarousel
        ? {
              transform: `translateX(-${currentIndex * cardWidthPercent}%)`,
              transition: isTransitioning ? `transform ${TRANSITION_MS}ms ease-in-out` : "none",
              willChange: "transform",
          }
        : {};

    const wasDragged = () => Math.abs(dragDistance.current) > 10;

    return {
        cardWidthPercent,
        shouldCarousel,
        containerProps,
        containerClassName,
        trackStyle,
        buildDisplayItems,
        wasDragged,
    };
}