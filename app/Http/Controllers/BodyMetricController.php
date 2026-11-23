<?php

namespace App\Http\Controllers;

use App\Models\BodyMetric;
use App\Services\WeightTrend;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class BodyMetricController extends Controller
{
    public function index(Request $request, WeightTrend $trend): View
    {
        $user = $request->user();
        $all = $user->bodyMetrics()->orderBy('date')->get();
        $recent = $all->filter(fn ($m) => $m->date->gte(now()->subDays(120)));

        return view('body.index', [
            'entries' => $all->sortByDesc('date')->values(),
            'trend' => $trend->analyze($all->filter(fn ($m) => $m->date->gte(now()->subDays(60)))),
            'weightSeries' => $recent->whereNotNull('weight_kg')->map(fn ($m) => [$m->date->toDateString(), $m->weight_kg])->values(),
            'waistSeries' => $recent->whereNotNull('waist_cm')->map(fn ($m) => [$m->date->toDateString(), $m->waist_cm])->values(),
            'todayEntry' => $all->first(fn ($m) => $m->date->isToday()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'weight_kg' => ['nullable', 'numeric', 'between:30,250', 'required_without:waist_cm'],
            'waist_cm' => ['nullable', 'numeric', 'between:40,200'],
        ], [
            'weight_kg.required_without' => 'Isi berat atau lingkar perut.',
        ]);

        $metric = $request->user()->bodyMetrics()->firstOrNew(['date' => $data['date']]);
        // Jangan menghapus nilai lama kalau kolomnya dikosongkan
        $metric->fill(array_filter($data, fn ($v) => $v !== null))->save();

        return redirect()->route('body.index')->with('status', 'Catatan badan tersimpan.');
    }

    public function destroy(Request $request, BodyMetric $metric): RedirectResponse
    {
        abort_unless($metric->user_id === $request->user()->id, 404);
        $metric->delete();

        return back()->with('status', 'Catatan dihapus.');
    }
}
