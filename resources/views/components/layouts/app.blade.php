@props(['title' => null, 'mainClass' => 'wrap'])
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#16202B">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <title>{{ $title ? $title.' · ' : '' }}Catatan Gym</title>
    <link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
    <link rel="icon" href="{{ asset('icon.svg') }}" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}?v={{ filemtime(public_path('css/app.css')) }}">
</head>
<body>
@auth
    <header class="topbar">
        <a class="brand" href="{{ route('dashboard') }}"><x-icon name="dumbbell" />Catatan Gym</a>
        <form method="post" action="{{ route('logout') }}">
            @csrf
            <button class="btn ghost small" type="submit"><x-icon name="logout" />Keluar</button>
        </form>
    </header>

    <nav class="tabbar" aria-label="Menu utama">
        @php
            $tabs = [
                ['dashboard', 'Beranda', 'home', 'dashboard'],
                ['workouts.index', 'Latihan', 'dumbbell', 'workouts.*|exercises.*'],
                ['daily.index', 'Harian', 'calendar', 'daily.*'],
                ['body.index', 'Badan', 'scale', 'body.*'],
            ];
        @endphp
        @foreach ($tabs as [$route, $label, $icon, $match])
            <a href="{{ route($route) }}" @if (request()->routeIs(...explode('|', $match))) aria-current="page" @endif>
                <x-icon :name="$icon" />{{ $label }}
            </a>
        @endforeach
    </nav>
@endauth

<main class="{{ $mainClass }}">
    @if (session('status'))
        <p class="flash" role="status">{{ session('status') }}</p>
    @endif
    @if ($errors->any())
        <div class="errors" role="alert">
            <ul>@foreach ($errors->all() as $e)<li>{{ $e }}</li>@endforeach</ul>
        </div>
    @endif

    {{ $slot }}
</main>

<script src="{{ asset('js/app.js') }}?v={{ filemtime(public_path('js/app.js')) }}" defer></script>
</body>
</html>
