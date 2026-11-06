# Reading and publishing costs

**Cost to read** is zero when OpenAlex reports open access or supplies an open copy without an explicit closed-access flag. Follow the open-copy link when available. Atlas displays the reading price as unavailable when it has no verified price. A publisher may charge for an individual article, or your library may already provide access. OpenAlex does not supply paywall prices. [OpenAlex access data](https://help.openalex.org/data/works/open-access/)

**Journal publishing fee estimate** is the listed article processing charge (APC) for making an article open access. Search cards use the OpenAlex work’s `apc_list` and the ISSN journal checker uses the matched source’s `apc_prices` and `apc_usd`. The first reported valid price provides the display currency. Cost ordering can compare prices using the USD value supplied by OpenAlex and places prices without a comparable amount last. Zero is retained when explicitly reported. [Work fields](https://help.openalex.org/data/works/attributes/) · [Journal fields](https://help.openalex.org/data/sources/attributes/)

OpenAlex combines DOAJ and curated fee data. Many venues, especially hybrid journals, have no listed amount. The estimate can reflect a current list price on an older paper and excludes negotiated rates, institutional coverage, waivers, taxes and additional fees. Some journals offer a separate subscription publishing route. Check the current publisher terms before budgeting. [OpenAlex source coverage](https://help.openalex.org/data/sources/#apc-data)

The fee fields use the existing OpenAlex requests. No extra per-result lookup, key, or paid service is required. Older backups can still be opened, and fee fields remain optional.
