@props(['name'])
@php
$paths = [
    'home' => '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
    'dumbbell' => '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    'calendar' => '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    'scale' => '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9.5a4 4 0 0 1 6 0M12 9.5l1.2-1.6"/>',
    'check' => '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    'alert' => '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.01"/>',
    'info' => '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    'up' => '<path d="M12 19V5M6 11l6-6 6 6"/>',
    'plus' => '<path d="M12 5v14M5 12h14"/>',
    'trash' => '<path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/>',
    'play' => '<path d="M8 5l11 7-11 7z"/>',
    'logout' => '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    'chevron-left' => '<path d="M15 6l-6 6 6 6"/>',
    'chevron-right' => '<path d="M9 6l6 6-6 6"/>',
    'chart' => '<path d="M4 19h16M7 16v-5M12 16V7M17 16v-8"/>',
    'video' => '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
];
@endphp
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" {{ $attributes }}>{!! $paths[$name] ?? '' !!}</svg>
