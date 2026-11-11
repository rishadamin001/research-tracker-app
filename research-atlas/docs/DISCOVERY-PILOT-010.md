# Pilot relevance baseline

11 November 2026, 19:07–19:09 Asia/Dhaka. One reviewer assessed the first ten results for three sample undergraduate queries. The records were retrieved with the same anonymous first-page query parameters as the app's relevance order, requesting 20 results in the provider's score order with no optional filters. Crossref included the app's default journal-article filter. The review used the supplied title, venue and up to 1,000 characters of the abstract when available, with OpenAlex excerpts capped at the first 120 words. Full text, methodological quality, recall and learner outcomes were outside this exercise. [OpenAlex relevance documentation](https://help.openalex.org/api/searching/#relevance-score) · [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)

**Rubric.** Direct meets the topic, population or setting, and outcome specified below. Partial addresses a substantial part of that question or leaves an essential criterion uncertain in the available metadata. Off-topic shares search terms but does not address the research topic. Precision at ten is the direct count divided by ten. A failed request has no relevance score.

| Sample topic and provider | Direct | Partial | Off-topic | Precision at ten |
| --- | ---: | ---: | ---: | ---: |
| Academic procrastination and sleep in university students, OpenAlex | 7 | 3 | 0 | 0.70 |
| Tree canopy and urban surface heat, OpenAlex | 6 | 4 | 0 | 0.60 |
| Phishing awareness training for university students, Crossref | 0 | 9 | 1 | 0.00 |

The Crossref row uses a different query and corpus than the two successful OpenAlex rows. Treat the rows as observations for those query/provider pairs. The computing query is missing an OpenAlex relevance score.

## Education

Query `university students academic procrastination sleep quality`. Direct results examine academic procrastination and a measure of sleep quality in a higher-education population. The studies can assess that relationship alongside other predictors or outcomes.

| Rank | Judgment | Rationale |
| ---: | --- | --- |
| 1 | Direct | University undergraduates, academic procrastination and sleep quality. |
| 2 | Direct | Medical university students and the relationship between the two variables. |
| 3 | Direct | Higher-education study measures both variables and examines their relationship alongside guilt and burnout. |
| 4 | Direct | Correlational study of academic procrastination and sleep quality among university students. |
| 5 | Partial | University students and sleep quality, but the study measures bedtime procrastination. |
| 6 | Direct | Higher-education survey measures both variables and examines their association in a broader model. |
| 7 | Direct | Dissertation examines academic procrastination and sleep quality across degree levels. |
| 8 | Partial | Describes academic procrastination among university students without a sleep outcome in the supplied metadata. |
| 9 | Direct | University study examines academic procrastination and sleep during exams and measures sleep quality. |
| 10 | Partial | University samples and sleep quality, but it examines general trait procrastination. |

## Urban climate

Query `urban tree canopy surface temperature heat island`. Direct results examine tree canopy or shade in relation to measured, modeled or reviewed urban surface temperature or surface heat islands. Studies of air temperature or human heat stress alone qualify as partial.

| Rank | Judgment | Rationale |
| ---: | --- | --- |
| 1 | Partial | Urban tree cover and modeled heat-island mitigation. The reviewed excerpt leaves the surface-temperature outcome uncertain. |
| 2 | Partial | Tree canopy and human heat stress. No abstract was supplied to confirm surface temperature as a primary outcome. |
| 3 | Direct | The title identifies urban tree canopy loss and land surface temperature. |
| 4 | Direct | The review includes tree shading and surface heating within urban heat mitigation. |
| 5 | Direct | Examines tree-canopy structure and land surface temperature. |
| 6 | Direct | The title names urban tree canopy and land surface temperature. |
| 7 | Direct | Examines soil surface temperatures and mitigation by trees and shrubs. |
| 8 | Partial | Green and blue spaces and air temperatures in the urban canopy and boundary layers. |
| 9 | Direct | Examines trees and surface heat in urban street canyons. |
| 10 | Partial | Urban trees and city-level heat and energy trends. The reviewed metadata leaves the canopy–surface-temperature relationship uncertain. |

## Computing

Query `student phishing awareness training university`. Direct results examine or describe a phishing-awareness training intervention for students in higher education. General student awareness surveys, detection studies and workplace training qualify as partial.

| Rank | Judgment | Rationale |
| ---: | --- | --- |
| 1 | Off-topic | University student awareness survey about color blindness. |
| 2 | Partial | Evaluates phishing awareness training at enterprise scale. |
| 3 | Partial | Phishing awareness and training for general users. |
| 4 | Partial | Combines awareness training and automated detection. The supplied excerpt does not identify a university-student group. |
| 5 | Partial | Phishing training in organizational settings. |
| 6 | Partial | College-student awareness survey and detection-system evaluation without a student training intervention in the supplied excerpt. |
| 7 | Partial | Workplace training tools. |
| 8 | Partial | Reviews training across several contexts. The available excerpt does not establish an evaluated university-student intervention. |
| 9 | Partial | General review of security awareness training and phishing. |
| 10 | Partial | Training platform for corporate employees. |

## Request outcomes and metadata limits

- OpenAlex returned HTTP 200 for education and urban climate. Computing returned HTTP 429 at 19:07:55, with a 38-second retry wait. One retry at 19:08:54 returned another HTTP 429. The run stopped querying OpenAlex at that point.
- Crossref returned HTTP 200 for computing at 19:09:35. The request used its journal-article search. The first result shared general university-student awareness terms while missing the substantive phishing topic.
- Four Crossref records and three OpenAlex urban-climate records omitted abstracts. Four OpenAlex records omitted DOI metadata. OpenAlex returned one dissertation and one article whose primary location was a repository. These records require source-type checks before drawing conclusions about journal publication or review.
- The scripts made direct HTTP requests. Browser cross-origin behavior, failed-page preservation, retry UI and actual mobile use require separate browser observations. The sample and single reviewer give no basis for a general provider-quality comparison.

## Repeat the protocol

Before another run, fix the queries, each direct-match criterion, the providers and the ranking or filter variants being compared. Capture HTTP status, time, query parameters, rank, work identifiers, title, venue, year and abstract availability. Rate the same queries across each provider or variant with two independent reviewers, reconcile disagreements, and retain partial-match reasons and service failures. Report direct precision per query and provider, along with metadata gaps and the number of unavailable runs.
