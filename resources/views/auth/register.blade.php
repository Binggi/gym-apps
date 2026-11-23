<x-layouts.app title="Buat akun" mainClass="auth">
    <div class="page-head">
        <h1>Buat akun</h1>
        <p class="lead">Sekali saja. Setelah akun ini dibuat, halaman daftar ditutup.</p>
    </div>
    <form class="card" method="post" action="{{ route('register') }}">
        @csrf
        <div class="field">
            <label for="name">Nama</label>
            <input id="name" type="text" name="name" value="{{ old('name') }}" required autofocus autocomplete="name">
        </div>
        <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="username">
        </div>
        <div class="field">
            <label for="password">Kata sandi <span class="hint">minimal 8 karakter</span></label>
            <input id="password" type="password" name="password" required autocomplete="new-password">
        </div>
        <div class="field">
            <label for="password_confirmation">Ulangi kata sandi</label>
            <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password">
        </div>
        <button class="btn primary block" type="submit">Buat akun</button>
    </form>
</x-layouts.app>
