# Resource directory, data quality as of 2026-08-26

Measured against `ALL_RESOURCES` in `constants.ts`, 308 records.

```
field           present   missing   notes
id                  308         0
name                308         0
category            308         0
resourceType        308         0
communityFocus      308         0
geographicArea      308         0
spa                 308         0   free text, 28 distinct values, see below
description         308         0
phone               300         8
website             298        10
address             265        43
email               246        62
serviceCategories    99       209
source               88       220   71 percent have no provenance
lastUpdated          88       220   and the newest is 2025-12
hours                76       232
eligibility          74       234
referralNotes        58       250
targetPopulation     12       296
languages             3       305
```

## The three findings that matter

**Every record is past its review window.** The SIREN guide's benchmark, which is what
Aunt Bertha, Healthify, NowPow, One Degree and Pieces Iris all hold themselves to, is that
a comprehensive directory reviews every resource at least every six months. The most
recent `lastUpdated` in this directory is `2025-12`. As of August 2026 that is eight months
on the newest record, and 220 records carry no date at all, so their age is unknown rather
than old. A directory where nothing can be shown to be current is a directory a navigator
has to independently verify before using, which is the work it exists to save.

**Eligibility is missing on 234 of 308.** The guide is specific that listings should carry
program eligibility and a last-updated date, because eligibility is the field that decides
whether the person standing in front of you can actually be served. Without it, a referral
is a guess, and the failure lands on the person at the door rather than on us.

**`spa` is free text, and that is why the filter does not work.** 28 distinct values across
308 records, including `SPA 8`, `All SPAs`, `SPA 3, SPA 7`, and
`Multiple SPAs (SPA 2, SPA 3, SPA 4, SPA 5, SPA 6, SPA 7, SPA 8)`. Nothing can filter
reliably on that. It compounds a known defect in `ResourceDashboard.tsx`, where the search
splits the query and drops any token of length 1, so "housing in spa 1" loses the `1`
entirely, and then ORs the remaining words, so "housing" alone matches most of the file.

`languages` present on 3 of 308 is worth naming too. The guide lists filtering by language
as a baseline search requirement, and for this population it is not optional.

## What this is not

This is a count of empty fields, not a check of whether the filled ones are right. A phone
number being present says nothing about whether it connects. That is what the verification
project is for, and it is the more expensive half.
