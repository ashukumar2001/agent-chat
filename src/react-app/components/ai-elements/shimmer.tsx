"use client";

import { cn } from "@/lib/utils";
import type { MotionProps } from "motion/react";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { memo, useMemo } from "react";

type MotionHTMLProps = MotionProps & Record<string, unknown>;

const MotionP = motion.create("p") as React.ComponentType<MotionHTMLProps>;
const MotionSpan = motion.create("span") as React.ComponentType<MotionHTMLProps>;
const MotionDiv = motion.create("div") as React.ComponentType<MotionHTMLProps>;

export interface TextShimmerProps {
  children: string;
  as?: "p" | "span" | "div";
  className?: string;
  duration?: number;
  spread?: number;
}

const ShimmerComponent = ({
  children,
  as: tag = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) => {
  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread]
  );

  const motionProps = {
    animate: { backgroundPosition: "0% center" },
    className: cn(
      "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
      "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
      className
    ),
    initial: { backgroundPosition: "100% center" },
    style: {
      "--spread": `${dynamicSpread}px`,
      backgroundImage:
        "var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))",
    } as CSSProperties,
    transition: {
      duration,
      ease: "linear" as const,
      repeat: Number.POSITIVE_INFINITY,
    },
    children,
  } satisfies MotionHTMLProps & { children: string };

  if (tag === "span") {
    return <MotionSpan {...motionProps} />;
  }
  if (tag === "div") {
    return <MotionDiv {...motionProps} />;
  }
  return <MotionP {...motionProps} />;
};

export const Shimmer = memo(ShimmerComponent);
