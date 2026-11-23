@props(['trend'])
@php
    $icon = ['good' => 'check', 'warning' => 'alert', 'critical' => 'alert', 'neutral' => 'info'][$trend['tone']];
    $rate = $trend['rate'];
@endphp
<div class="note {{ $trend['tone'] }}" role="status">
    <x-icon :name="$icon" />
    <div>
        <b>{{ $trend['title'] }}@if ($rate !== null) · {{ $rate <= 0 ? 'turun' : 'naik' }} {{ number_format(abs($rate), 2, ',', '.') }} kg/minggu @endif</b>
        <span>{{ $trend['text'] }}</span>
    </div>
</div>
