"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const Logo = ({ className }: { className?: string }) => {
    return (
        <img 
            src="/logo.svg" 
            alt="Godaapp Logo" 
            className={cn('h-12 w-auto object-contain', className)} 
            loading="eager" 
        />
    );
};

export function MinimalFooter() {
	const year = new Date().getFullYear();

	const company = [
		{ title: 'About Us', href: '/about' },
		{ title: 'Affiliate Program', href: '/affiliate' },
		{ title: 'Contact Us', href: '/contact' },
		{ title: 'Privacy Policy', href: '/privacy-policy' },
		{ title: 'Terms of Service', href: '/terms-of-service' },
	];

	const resources = [
		{ title: 'Courses', href: '/catalog' },
		{ title: 'Sign Up', href: '/sign-up' },
		{ title: 'Contact Support', href: '/contact' },
		{ title: 'Community', href: 'https://x.com/godaapp' },
		{ title: 'Faq', href: '/faq' },
	];

	const socialLinks = [
		{
			name: 'Facebook',
			icon: (
				<svg className="size-4 fill-current" viewBox="0 0 24 24" xmlns="http://w3.org">
					<path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z"/>
				</svg>
			),
			link: 'https://web.facebook.com/Godaapp',
		},
		{
			name: 'Github',
			icon: (
				<svg className="size-4 fill-current" viewBox="0 0 24 24" xmlns="http://w3.org">
					<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.061.069-.061 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
				</svg>
			),
			link: '#',
		},
		{
			name: 'Instagram',
			icon: (
				<svg className="size-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" xmlns="http://w3.org">
					<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
					<path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01"/>
				</svg>
			),
			link: 'https://www.instagram.com/godaappofficial',
		},
		{
			name: 'Linkedin',
			icon: (
				<svg className="size-4 fill-current" viewBox="0 0 24 24" xmlns="http://w3.org">
					<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
				</svg>
			),
			link: 'https://www.linkedin.com/company/godaapp/',
		},
		{
			name: 'Twitter',
			icon: (
				<svg className="size-4 fill-current" viewBox="0 0 24 24" xmlns="http://w3.org">
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
				</svg>
			),
			link: 'https://x.com/godaapp',
		},
		{
			name: 'Youtube',
			icon: (
				<svg className="size-4 fill-current" viewBox="0 0 24 24" xmlns="http://w3.org">
					<path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
				</svg>
			),
			link: 'https://www.youtube.com/@Godaapp',
		},
	];

	return (
		// 💡 THE PERMANENT FIX: Wrapped everything in an isolated container that enforces black background layering
		<div className="relative w-full bg-black isolate z-10">
			
			{/* 
			  ========================================================================
			  💡 AMBIENT LIGHT HORIZON SHEEN OVERLAY
			  Amplified and repositioned to break through and separate the cream section above
			  ========================================================================
			*/}
						{/* 
			  ========================================================================
			  💡 EDGE-TO-EDGE FULL WIDTH REFLECTION GLOW LAYER
			  Stretches across 100% of the viewport width to replicate your reference image
			  ========================================================================
			*/}
			<div className="absolute top-0 left-0 w-full h-[220px] pointer-events-none z-20 overflow-hidden select-none">
				
				{/* Layer 1: Core Intense Reflection Line (Stretches across the top) */}
				<div 
					className="absolute top-0 left-0 w-full h-[120px] opacity-100 mix-blend-screen"
					style={{
						background: 'radial-gradient(50% 40% at 50% 0%, rgba(255, 255, 255, 0.22) 0%, rgba(6, 131, 101, 0.08) 70%, transparent 100%)',
					}}
				/>
				
				{/* Layer 2: Wide Ambient Teal Backdrop Fog (Spreads edge-to-edge over the footer content) */}
				<div 
					className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] h-[180px] opacity-100 blur-[35px] mix-blend-plus-linear"
					style={{
						background: 'radial-gradient(50% 50% at 50% 0%, rgba(6, 131, 101, 0.3) 0%, rgba(6, 131, 101, 0.03) 60%, transparent 100%)',
					}}
				/>
				
				{/* Layer 3: Solid top border line tracing right beneath the light ray */}
				<div className="absolute top-0 inset-x-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
			</div>


			{/* Main Content Area */}
			<footer className="relative w-full text-white border-t border-white/5 z-10 overflow-hidden">
				<div className="mx-auto max-w-7xl px-6 py-16">
					<div className="grid grid-cols-6 gap-8">
						
						{/* Brand Left Column */}
						<div className="col-span-6 flex flex-col gap-5 md:col-span-4">
							<Link href="#" className="flex items-center gap-2 text-zinc-100 hover:text-white transition w-max">
								<Logo />
							</Link>
							<p className="text-zinc-400 max-w-sm text-sm leading-relaxed">
								Global Digital Assets Academy is an independent educational platform and is not a broker, investment advisor, or financial institution. All educational content is provided for informational purposes only and should not be construed as financial advice.
							</p>
							
							{/* Social Rounded Links */}
							<div className="flex gap-2">
								{socialLinks.map((item, i) => (
									<a
										key={i}
										className="hover:bg-white/10 rounded-xl border border-white/10 p-2 duration-200 text-zinc-400 hover:text-white flex items-center justify-center backdrop-blur-sm"
										target="_blank"
										rel="noopener noreferrer"
										href={item.link}
										aria-label={item.name}
									>
										{item.icon}
									</a>
								))}
							</div>
						</div>

						{/* Resources Navigation Column */}
						<div className="col-span-3 w-full md:col-span-1">
							<span className="text-zinc-500 font-semibold uppercase tracking-wider text-xs block mb-3">
								Resources
							</span>
							<div className="flex flex-col gap-2">
								{resources.map(({ href, title }, i) => (
									<Link
										key={i}
										className="w-max text-sm text-zinc-400 duration-200 hover:text-white font-medium"
										href={href}
									>
										{title}
									</Link>
								))}
							</div>
						</div>

						{/* Company Navigation Column */}
						<div className="col-span-3 w-full md:col-span-1">
							<span className="text-zinc-500 font-semibold uppercase tracking-wider text-xs block mb-3">
								Company
							</span>
							<div className="flex flex-col gap-2">
								{company.map(({ href, title }, i) => (
									<Link
										key={i}
										className="w-max text-sm text-zinc-400 duration-200 hover:text-white font-medium"
										href={href}
									>
										{title}
									</Link>
								))}
							</div>
						</div>
					</div>

					{/* Bottom Copyright Strip Area */}
					<div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
						<p className="text-xs text-zinc-500 font-normal">
						&copy; {year} Goda App. All rights reserved.
						</p>
						<p className="text-[11px] text-zinc-600 font-normal">
							Designed by <a href="https://x.com/ocheakor4" target="_blank" rel="noopener noreferrer" className="hover:underline">Davoc Technology</a>
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
