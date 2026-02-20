<?php

namespace App\Services;

use App\Models\UserVerseResource;
use GuzzleHttp\Exception\RequestException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\UriInterface;
use Spatie\Crawler\CrawlObservers\CrawlObserver;
use Symfony\Component\DomCrawler\Crawler;

class TitleCrawlObserver extends CrawlObserver
{
    protected $resource;
    protected $titleFound = false;

    public function __construct(UserVerseResource $resource)
    {
        $this->resource = $resource;
    }

    /**
     * Called when the crawler has crawled the given url successfully.
     *
     * @param \Psr\Http\Message\UriInterface $url
     * @param \Psr\Http\Message\ResponseInterface $response
     * @param \Psr\Http\Message\UriInterface|null $foundOnUrl
     */
    public function crawled(
        UriInterface $url,
        ResponseInterface $response,
        ?UriInterface $foundOnUrl = null,
        ?string $linkText = null
    ): void {
        $html = (string) $response->getBody();
        $crawler = new Crawler($html);
        
        try {
            $title = $crawler->filter('title')->text();
            
            if (!empty($title)) {
                $this->resource->update([
                    'resource_title' => trim($title)
                ]);
                $this->titleFound = true;
            }
        } catch (\InvalidArgumentException $e) {
            // Title tag not found
        }
    }

    /**
     * Called when the crawler had a problem crawling the given url.
     *
     * @param \Psr\Http\Message\UriInterface $url
     * @param \GuzzleHttp\Exception\RequestException $requestException
     * @param \Psr\Http\Message\UriInterface|null $foundOnUrl
     */
    public function crawlFailed(
        UriInterface $url,
        RequestException $requestException,
        ?UriInterface $foundOnUrl = null,
        ?string $linkText = null
    ): void {
        // Log failure or handle as needed
    }

    /**
     * Called when the crawl has ended.
     */
    public function finishedCrawling(): void
    {
        // Occurs after the entire crawl process is done for the URL
    }
}
