### From Quran

#### Summary 

A site similar to Quran.com but with the following additional features. 

- Each surah will have resources tagged, namely 
- Youtube Tafseer
- Any podcast
- Articles
- Shan e nuzul
- Comments (verified, curated)
- Each Ayat will have a tab that will list 
- Similar Ayah
- Relevant Ayah
- Relevant Dua
- Related Hadith
- Related Fiqh ruling
- Tafseer(s)
- Articles link 
- Fatwa where the ayah is mentioned (e.g islamQA)
- Youtube video where this Ayah is discussed
- Scholarly commentary
- Website Links
- Audio
- Ayat Corpus with MindMap chart 

##### Stack

```
Frontend        : NextJS (React Universal app)
API Server      : Laravel with Octane
Backend Panel	: Laravel
Search          : Apache Solr 
Deloyment       : Netlify + Cloudflare Worker
API Hosting 	: AWS/DO/Ramnode 
Solr Hosting 	: AWS/DO/Ramnode
```

##### Frontend Screens 
- Home Page
- Surah List
- Surah By Page Like Quran.com
- Surah with Ayaat translation
- Ayat Details Page with All resources in Popup, mentioned in Tab
- Search Landing Page (Basic/Advanced Options)
- Search Results Page
- List Ayah by tags
- Suggest (user contribution)
- Subscription for update
- Settings
- Account
- My List/Collection
- Share Collection
- Q&A style question and answers about Quran. E.g - what is the longest ayat in Quran. 

##### Backend Screens

- Manage Users/Roles
- Manage tags
- Manage User contributions
- Browse All ayat
- Manage Resources per Ayah
- Manage Tafseers
- Manage Translations
- Search