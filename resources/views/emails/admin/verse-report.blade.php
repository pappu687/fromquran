<x-mail::message>
    # New Verse Error Report

    A new error report has been submitted by a user.

    **Report Type:** {{ $report->type }}

    **Verse details:**
    - **Chapter ID:** {{ $report->chapter_id }}
    - **Verse ID:** {{ $report->verse_id }}

    **Description:**
    {{ $report->description }}

    <x-mail::button :url="url('/admin/verse-reports')">
        View Reports
    </x-mail::button>

    Thanks,<br>
    {{ config('app.name') }}
</x-mail::message>
