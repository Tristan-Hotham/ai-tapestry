# The AI Tapestry

The history of artificial intelligence, embroidered in the manner of the Bayeux Tapestry: one long strip you scroll sideways, from Ada Lovelace's notes on the Analytical Engine (1843) to the AI agents of the mid-2020s. Each scene has a caption in the dog Latin of the original, a plain English line, a short factual note and links to its sources. The borders carry the asides: the summer that was meant to be enough, the herald announcing that the perceptron will walk, the snow of the AI winters, a student asleep on the homework.

Interactive page: https://maps.tristanhotham.com/ai-tapestry/
Paper, data and code: https://doi.org/10.5281/zenodo.23866754
Blog post: https://blog.tristanhotham.com/2026/10/31/ai-tapestry/

## The scenes

1843 Lovelace's notes · 1950 Turing's question · 1956 Dartmouth · 1958 the perceptron · 1966 ELIZA · 1973 the Lighthill report and the first AI winter · 1980 expert systems and the second winter · 1986 backpropagation · 1997 Deep Blue · 2011 Watson · 2012 AlexNet, ImageNet and the cats · 2015 OpenAI founded · 2016 AlphaGo's move 37 · 2017 the transformer (the comet) · 2019 GPT-2 held back · 2020 AlphaFold · 2022 an AI painting wins the art prize · 2022 ChatGPT · 2023 Bard gets the stars wrong · 2023 Will Smith eats spaghetti · 2023 the lawyers' invented cases · 2023 the writers' and actors' strikes · 2023 Bletchley Park · 2023 Sam Altman sacked and back in five days · 2024 glue on pizza · 2024 Jensen Huang crowned in his leather jacket · 2024 the Nobel prizes · 2025 the castles of data · 2025 DeepSeek's whale · 2025 vibe coding · 2025 the singers and influencers who are nobody · 2025 gold at the Maths Olympiad · 2025 the Erdős problems that were already solved · 2025 agents · and the unfinished end.

## How it works

| File | What it is |
|---|---|
| `index.html` | The page: the scrolling strip, timeline, scene cards, full-screen button and the write-up. |
| `js/tapestry.js` | The stitch kit: laid-and-couched wool fills, stem-stitch outlines, figures in the Bayeux manner, trees, borders and the objects of each scene, all drawn as SVG. |
| `data/scenes.js` | The scenes, in order. Each has a year, Latin caption, English, note, sources, width, what to stitch and optional marginal jokes. |
| `data/scenes.json` | The same scenes as plain data (no drawing instructions), for reuse. |
| `code/paper.py` | Builds the short paper from `data/scenes.json`. |
| `release/` | The paper, blog post and Zenodo files. |

To add a scene, add an entry to `data/scenes.js` before the unfinished end, following the comments at the top of the file. Nothing is traced or copied from the Bayeux Tapestry itself.

## Licence and credit

Code MIT; text, scene notes and images CC BY 4.0. Dr Tristan Hotham, Independent researcher, 2026. ORCID 0000-0003-4931-9349. Not connected with the Bayeux Museum. One of the machines on the cloth helped stitch it; every factual claim was checked against the linked sources.
