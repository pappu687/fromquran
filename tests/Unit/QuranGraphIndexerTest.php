<?php

namespace Tests\Unit;

use App\Models\Topic;
use App\Services\Arango\QuranGraphIndexer;
use PHPUnit\Framework\TestCase;

class QuranGraphIndexerTest extends TestCase
{
    /** @test */
    public function it_generates_deterministic_chapter_keys()
    {
        $this->assertSame('chapter_1', QuranGraphIndexer::chapterKey(1));
        $this->assertSame('chapter_114', QuranGraphIndexer::chapterKey(114));
    }

    /** @test */
    public function it_generates_deterministic_verse_keys()
    {
        $this->assertSame('verse_1_1', QuranGraphIndexer::verseKey(1, 1));
        $this->assertSame('verse_2_255', QuranGraphIndexer::verseKey(2, 255));
    }

    /** @test */
    public function it_generates_deterministic_topic_keys()
    {
        $this->assertSame('topic_1', QuranGraphIndexer::topicKey(1));
        $this->assertSame('topic_999', QuranGraphIndexer::topicKey(999));
    }

    /** @test */
    public function it_generates_deterministic_resource_keys()
    {
        $this->assertSame('resource_uvr_1', QuranGraphIndexer::resourceUvrKey(1));
        $this->assertSame('resource_ucr_1', QuranGraphIndexer::resourceUcrKey(1));
    }

    /** @test */
    public function it_generates_deterministic_tafsir_keys()
    {
        $this->assertSame('tafsir_1_2_3', QuranGraphIndexer::tafsirKey(1, 2, 3));
    }

    /** @test */
    public function it_generates_deterministic_translation_keys()
    {
        $this->assertSame('translation_1_2_3', QuranGraphIndexer::translationKey(1, 2, 3));
    }

    /** @test */
    public function it_generates_deterministic_morphology_keys()
    {
        $this->assertSame('root_1', QuranGraphIndexer::rootKey(1));
        $this->assertSame('lemma_1', QuranGraphIndexer::lemmaKey(1));
        $this->assertSame('stem_1', QuranGraphIndexer::stemKey(1));
    }
}

class TopicParsingTest extends TestCase
{
    /** @test */
    public function it_parses_verse_keys_from_comma_separated_string()
    {
        $topic = new Topic(['ayahs' => '1:1,2:255,114:6']);
        $this->assertSame(['1:1', '2:255', '114:6'], $topic->getVerseKeys());
    }

    /** @test */
    public function it_handles_empty_ayahs()
    {
        $topic = new Topic(['ayahs' => null]);
        $this->assertSame([], $topic->getVerseKeys());
    }

    /** @test */
    public function it_trims_surrounding_commas_and_quotes()
    {
        $topic = new Topic(['ayahs' => "'1:1,2:255,'"]);
        $this->assertSame(['1:1', '2:255'], $topic->getVerseKeys());
    }

    /** @test */
    public function it_parses_related_topic_ids()
    {
        $topic = new Topic(['related_topics' => '1,2,3']);
        $this->assertSame([1, 2, 3], $topic->getRelatedTopicIds());
    }

    /** @test */
    public function it_handles_empty_related_topics()
    {
        $topic = new Topic(['related_topics' => null]);
        $this->assertSame([], $topic->getRelatedTopicIds());
    }
}
