import { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Edition {
    identifier: string;
    language: string;
    name: string;
    englishName: string;
    format: string;
    type: string;
    direction: string;
}

interface TranslationSelectorProps {
    selectedEdition?: string;
    onEditionChange: (edition: string) => void;
    className?: string;
}

export function TranslationSelector({
    selectedEdition = 'en.sahih',
    onEditionChange,
    className
}: TranslationSelectorProps) {
    const [editions, setEditions] = useState<Edition[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchEditions();
    }, []);

    const fetchEditions = async () => {
        try {
            const response = await fetch('/api/quran/editions');
            const data = await response.json();
            setEditions(data);
        } catch (error) {
            console.error('Failed to fetch editions:', error);
            // Fallback to common editions
            setEditions([
                {
                    identifier: 'en.sahih',
                    language: 'en',
                    name: 'Saheeh International',
                    englishName: 'Saheeh International',
                    format: 'text',
                    type: 'translation',
                    direction: 'ltr'
                },
                {
                    identifier: 'ar',
                    language: 'ar',
                    name: 'القرآن الكريم',
                    englishName: 'Simple Quran',
                    format: 'text',
                    type: 'quran',
                    direction: 'rtl'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const currentEdition = editions.find(e => e.identifier === selectedEdition);

    const groupEditionsByLanguage = (editionList: Edition[]) => {
        const grouped = editionList.reduce((acc, edition) => {
            if (!acc[edition.language]) {
                acc[edition.language] = [];
            }
            acc[edition.language].push(edition);
            return acc;
        }, {} as Record<string, Edition[]>);

        return Object.entries(grouped).map(([language, langEditions]) => ({
            language,
            languageName: getLanguageName(language),
            editions: langEditions
        }));
    };

    const getLanguageName = (code: string): string => {
        const languages: Record<string, string> = {
            'ar': 'Arabic',
            'en': 'English',
            'ur': 'Urdu',
            'id': 'Indonesian',
            'ms': 'Malay',
            'tr': 'Turkish',
            'fr': 'French',
            'de': 'German',
            'es': 'Spanish',
            'ru': 'Russian',
            'hi': 'Hindi',
            'bn': 'Bengali',
            'zh': 'Chinese',
            'fa': 'Persian',
            'ha': 'Hausa',
            'sw': 'Swahili',
            'ta': 'Tamil',
            'tg': 'Tagalog'
        };
        return languages[code] || code.toUpperCase();
    };

    if (loading) {
        return (
            <Button variant="outline" disabled className={className}>
                <Globe className="h-4 w-4 mr-2" />
                Loading...
            </Button>
        );
    }

    const groupedEditions = groupEditionsByLanguage(editions);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={className}>
                    <Globe className="h-4 w-4 mr-2" />
                    {currentEdition ? currentEdition.englishName : 'Select Translation'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
                <DropdownMenuLabel>Choose Translation</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {groupedEditions.map(({ language, languageName, editions: langEditions }) => (
                    <div key={language}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {languageName}
                        </div>
                        {langEditions.map((edition) => (
                            <DropdownMenuItem
                                key={edition.identifier}
                                onClick={() => {
                                    onEditionChange(edition.identifier);
                                    setOpen(false);
                                }}
                                className="flex flex-col items-start p-2 cursor-pointer"
                            >
                                <div className="flex items-center w-full justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{edition.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {edition.type === 'quran' ? 'Arabic Text' : 'Translation'}
                                        </span>
                                    </div>
                                    {selectedEdition === edition.identifier && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))}
                        {language !== groupedEditions[groupedEditions.length - 1]?.language && (
                            <DropdownMenuSeparator />
                        )}
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}