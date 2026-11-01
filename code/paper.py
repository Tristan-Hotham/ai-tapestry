"""Builds the short paper (release/paper) from data/scenes.json. Usage: python3 code/paper.py <DOI>"""
import json, os, re, subprocess, sys
ROOT = os.path.join(os.path.dirname(__file__), '..')
doi = sys.argv[1] if len(sys.argv) > 1 else '10.5281/zenodo.XXXXXXX'
S = json.load(open(os.path.join(ROOT, 'data', 'scenes.json')))
def tex(s):
    s = str(s)
    for a, b in [('\\', r'\textbackslash{}'), ('&', r'\&'), ('%', r'\%'), ('$', r'\$'), ('#', r'\#'), ('_', r'\_'), ('{', r'\{'), ('}', r'\}'), ('~', r'\textasciitilde{}'), ('^', r'\^{}')]:
        s = s.replace(a, b)
    s = re.sub(r'"([^"]*)"', r"``\1''", s)
    return s.replace('◄', '<').replace('♪', '').replace('♫', '')
rows = []
for s in S:
    src = '; '.join(r'\href{%s}{%s}' % (x['url'].replace('%', r'\%').replace('#', r'\#'), tex(x['title'])) for x in s['sources'])
    rows.append(r'\textbf{%s} & \textsc{%s}\newline\emph{%s}\newline %s\newline{\footnotesize Sources: %s}\\[4pt]' % (tex(s['year']), tex(s['latin']).lower(), tex(s['en']), tex(s['note']), src))
body = r'''\documentclass[11pt,a4paper]{article}
\usepackage{fontspec}
\setmainfont{TeX Gyre Pagella}
\usepackage[a4paper,margin=2.2cm]{geometry}
\usepackage{graphicx,longtable,array,xcolor,float,caption}
\usepackage{xurl}
\usepackage[hidelinks]{hyperref}
\setlength{\parindent}{0pt}\setlength{\parskip}{0.55em}
\captionsetup{font=small,labelfont=bf}
\hypersetup{pdftitle={The AI Tapestry},pdfauthor={Tristan Hotham}}
\begin{document}
\begin{center}
{\Large\bfseries The AI Tapestry\par}\vspace{0.4em}
{\large An embroidered history of artificial intelligence, in the manner of the Bayeux Tapestry\par}\vspace{1.1em}
{\large Tristan Hotham\par}\vspace{0.3em}
{\small Independent researcher\\ ORCID: 0000-0003-4931-9349\\ DOI: \href{https://doi.org/@@DOI@@}{@@DOI@@}\par}\vspace{0.7em}
2026
\end{center}
\begin{quote}\small\begin{center}\textbf{Abstract}\end{center}
I present the history of artificial intelligence as a single scrolling strip in the visual language of the Bayeux Tapestry, the eleventh-century embroidery of the Norman conquest. @@N@@ scenes run from Ada Lovelace's notes on the Analytical Engine (1843) to the AI agents of the mid-2020s, each with a caption in the dog Latin of the original, a plain English line, a short factual note and links to sources. The figures are drawn in code from a small kit of stitched shapes, so the cloth is generated from a list of scenes and can be extended as the history continues. The frame is chosen on purpose: the original is a long, partial account made for the winners, full of omens, feasts and fleets, and missing its end. The interactive version is at \url{https://maps.tristanhotham.com/ai-tapestry/}.
\end{quote}
\section*{1. Why a tapestry}
Histories of AI are usually told as timelines. A timeline gives every event the same weight and none of them a mood. The Bayeux Tapestry tells a story as a sequence of scenes in which people do things: they feast, point at a comet, build ships, swear oaths and fight, with Latin captions above and a running border of beasts and asides below. It is also openly partial. Treating the history of AI the same way makes room for the parts a timeline flattens: the boasts (the perceptron that would ``walk, talk, see, write''), the overconfidence (Dartmouth's ``2 month, 10 man study''), the winters, and the fact that the story has no end yet.
\section*{2. Method}
Every figure is drawn by code in SVG from a kit of parts in the manner of the original: oval heads with a cap of hair, short flared tunics with banded hems, coloured hose, stylised trees as dividers, and borders of paired beasts between diagonal bars. Fills imitate laid-and-couched work, rows of parallel wool held down by short stitches, and outlines imitate stem stitch, broken and slightly displaced so no line is ruler-straight. The palette follows the small range of natural dyes of the original: madder reds, weld yellows, woad blues, and greens from mixing them. Nothing is traced or copied from the tapestry itself.
Each scene is one entry in a list (\texttt{data/scenes.js}): a year, the Latin caption, its English, a note, sources, a width, the figures and objects to stitch, and optional marginal jokes for the borders. Adding a chapter is adding an entry. The notes are written to be accurate and fair rather than exhaustive, and every factual claim in them is linked to a source, mostly Wikipedia's articles and the primary papers and prize citations.
\section*{3. The scenes}
\begin{figure}[H]\centering\includegraphics[width=\linewidth]{f_turing.png}\caption{1950: Turing's imitation game, played through a curtain.}\end{figure}
\begin{figure}[H]\centering\includegraphics[width=\linewidth]{f_winter.png}\caption{1973: the Lighthill report and the first AI winter.}\end{figure}
\begin{figure}[H]\centering\includegraphics[width=\linewidth]{f_transformer.png}\caption{2017: ``ISTI MIRANT ATTENTIONEM'', after the comet scene of the original.}\end{figure}
\begin{figure}[H]\centering\includegraphics[width=\linewidth]{f_chatgpt.png}\caption{2022: everyone talks with the machine.}\end{figure}
{\small\begin{longtable}{>{\raggedright\arraybackslash}p{1.4cm}>{\raggedright\arraybackslash}p{14.4cm}}
@@ROWS@@
\end{longtable}}
\section*{4. Limits}
A tapestry chooses. These scenes favour landmark results and public moments over the slow accumulation of methods, data and hardware that made them possible, and they lean towards work in Britain and the United States. Many people who mattered are absent. The Latin is deliberately the loose Latin of the original, and the jokes are mine. The scene list is open, and the cloth is meant to be added to and corrected.
\section*{Data and code}
Scenes, drawing code, figures and this paper: \url{https://github.com/Tristan-Hotham/ai-tapestry} and DOI \href{https://doi.org/@@DOI@@}{@@DOI@@}. Code MIT; text and figures CC BY 4.0. The author used an AI system to help draft code and text, and checked every factual claim against the sources given.
\end{document}
'''
body = body.replace('@@ROWS@@', '\n'.join(rows)).replace('@@DOI@@', doi).replace('@@N@@', str(len(S)))
d = os.path.join(ROOT, 'release', 'paper'); os.makedirs(d, exist_ok=True)
open(os.path.join(d, 'Hotham_The_AI_Tapestry.tex'), 'w').write(body)
for _ in range(2): r = subprocess.run(['xelatex', '-interaction=nonstopmode', 'Hotham_The_AI_Tapestry.tex'], cwd=d, capture_output=True, text=True)
print(r.stdout[-600:] if 'Output written' not in r.stdout else 'pdf ok')
