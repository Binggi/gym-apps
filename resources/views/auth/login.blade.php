<x-layouts.app title="Masuk" mainClass="auth">
    <div class="page-head">
        <h1>Catatan Gym</h1>
        <p class="lead">Masuk untuk mencatat latihan hari ini.</p>
    </div>
    <form class="card" method="post" action="{{ route('login') }}">
        @csrf
        <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username">
        </div>
        <div class="field">
            <label for="password">Kata sandi</label>
            <input id="password" type="password" name="password" required autocomplete="current-password">
        </div>
        <button class="btn primary block" type="submit">Masuk</button>
    </form>
</x-layouts.app>
