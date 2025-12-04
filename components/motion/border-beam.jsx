'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export function BorderBeam({
	className,
	size = 200,
	duration = 8,
	borderWidth = 2,
	colorFrom = '#ffaa40',
	colorTo = '#9c40ff',
	delay = 0,
}) {
	const beamRef = useRef(null);

	useEffect(() => {
		const beam = beamRef.current;
		if (!beam) return;

		const parent = beam.parentElement;
		if (!parent) return;

		let startTime = null;
		let animationId = null;
		const radiusValue =
			Number.parseFloat(window.getComputedStyle(parent).borderRadius) || 0;

		const getMeasurements = () => {
			const rect = parent.getBoundingClientRect();
			const width = rect.width;
			const height = rect.height;
			const radius = Math.min(radiusValue, width / 2, height / 2);
			const cornerLength = Math.PI * radius * 0.5;
			const horizontal = Math.max(width - 2 * radius, 0);
			const vertical = Math.max(height - 2 * radius, 0);
			const perimeter = horizontal * 2 + vertical * 2 + cornerLength * 4;

			return { width, height, radius, cornerLength, horizontal, vertical, perimeter };
		};

		const getPosition = (distance, measurements) => {
			const {
				width,
				height,
				radius,
				cornerLength,
				horizontal,
				vertical,
				perimeter,
			} = measurements;

			let d = distance % perimeter;

			// Top edge (left to right)
			if (d <= horizontal) {
				return {
					x: radius + d,
					y: 0,
					dir: Math.PI / 2,
					isCorner: false,
					isVertical: false,
				};
			}
			d -= horizontal;

			// Top-right corner
			if (d <= cornerLength) {
				const angle = -Math.PI / 2 + (d / cornerLength) * (Math.PI / 2); // -90deg to 0deg
				return {
					x: width - radius + radius * Math.cos(angle),
					y: radius + radius * Math.sin(angle),
					dir: angle + Math.PI / 2,
					isCorner: true,
				};
			}
			d -= cornerLength;

			// Right edge (top to bottom)
			if (d <= vertical) {
				return {
					x: width,
					y: radius + d,
					dir: Math.PI,
					isCorner: false,
					isVertical: true,
				};
			}
			d -= vertical;

			// Bottom-right corner
			if (d <= cornerLength) {
				const angle = (d / cornerLength) * (Math.PI / 2); // 0deg to 90deg
				return {
					x: width - radius + radius * Math.cos(angle),
					y: height - radius + radius * Math.sin(angle),
					dir: angle + Math.PI / 2,
					isCorner: true,
				};
			}
			d -= cornerLength;

			// Bottom edge (right to left)
			if (d <= horizontal) {
				return {
					x: width - radius - d,
					y: height,
					dir: -Math.PI / 2,
					isCorner: false,
					isVertical: false,
				};
			}
			d -= horizontal;

			// Bottom-left corner
			if (d <= cornerLength) {
				const angle = Math.PI / 2 + (d / cornerLength) * (Math.PI / 2); // 90deg to 180deg
				return {
					x: radius + radius * Math.cos(angle),
					y: height - radius + radius * Math.sin(angle),
					dir: angle + Math.PI / 2,
					isCorner: true,
				};
			}
			d -= cornerLength;

			// Left edge (bottom to top)
			if (d <= vertical) {
				return {
					x: 0,
					y: height - radius - d,
					dir: 0,
					isCorner: false,
					isVertical: true,
				};
			}
			d -= vertical;

			// Top-left corner
			const angle = Math.PI + (d / cornerLength) * (Math.PI / 2); // 180deg to 270deg
			return {
				x: radius + radius * Math.cos(angle),
				y: radius + radius * Math.sin(angle),
				dir: angle + Math.PI / 2,
				isCorner: true,
			};
		};

		const animate = (timestamp) => {
			if (!startTime) startTime = timestamp + delay * 1000;

			const elapsed = timestamp - startTime;
			const progress = (elapsed / (duration * 1000)) % 1;

			const measurements = getMeasurements();
			const distance = progress * measurements.perimeter;
			const { x, y, dir, isCorner, isVertical } = getPosition(distance, measurements);

			const thickness = Math.max(borderWidth * 3, 6);
			const glowBlur = Math.max(borderWidth * 6, 12);

			if (isCorner) {
				beam.style.width = `${size}px`;
				beam.style.height = `${size}px`;
				beam.style.background = `radial-gradient(circle at center, ${colorFrom}, ${colorTo} 40%, transparent 70%)`;
			} else if (isVertical) {
				beam.style.width = `${thickness}px`;
				beam.style.height = `${size}px`;
				beam.style.background = `linear-gradient(${(dir * 180) / Math.PI}deg, transparent, ${colorFrom}, ${colorTo}, transparent)`;
			} else {
				beam.style.width = `${size}px`;
				beam.style.height = `${thickness}px`;
				beam.style.background = `linear-gradient(${(dir * 180) / Math.PI}deg, transparent, ${colorFrom}, ${colorTo}, transparent)`;
			}

			beam.style.left = `${x}px`;
			beam.style.top = `${y}px`;
			beam.style.transform = `translate(-50%, -50%)`;
			beam.style.filter = `blur(${glowBlur}px)`;
			beam.style.opacity = '0.9';
			beam.style.mixBlendMode = 'screen';

			animationId = requestAnimationFrame(animate);
		};

		animationId = requestAnimationFrame(animate);

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	}, [duration, delay, size, borderWidth, colorFrom, colorTo]);

	return (
		<div
			className={cn(
				'pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden',
				className
			)}
		>
			<div
				ref={beamRef}
				className='absolute'
				style={{
					borderRadius: '9999px',
				}}
			/>
		</div>
	);
}

export default BorderBeam;
