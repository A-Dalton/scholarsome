---
sidebar_position: 8
---

# Review

Review is the spaced repetition feature of Scholarsome. Instead of studying a set from front to back, cards are scheduled over time: cards you struggle with come back more often, while cards you know well come back less often. This way, the cards that are close to being forgotten are the ones you practice, which is more efficient for memorizing large collections of cards over long periods of time.

A review can span every set at once, a single folder with all of its subfolders, or a single set.

## Starting a review

The "Review all cards" and "Review folder" entry points are located in the "Review" section of the home page.

**Review all cards** starts a review of every card across all of your sets.

**Review folder** opens a tree of all of your folders, including subfolders. Click the arrow next to a folder to expand or collapse its subfolders, and click a folder to select it. All subfolders of the selected folder are highlighted as well, since they are included in the review. Then click "Review" underneath the tree.

A folder review includes every set that is connected to the selected folder or to one of its subfolders. Sets that are not connected to any folder are only part of "Review all cards".

**Review set** is available inside a study set that you have created. Click the "Review" button next to "Flashcards" and "Quiz" to start a review of just the cards of that set. Since a review is personal, the button is only shown to the author of the set.

:::info
Folders are a way to organize sets. See [Folders](/usage/folders/creating-folders) for how to create them and connect sets to them.
:::

## Configuring a session

Once a review is started, the review screen shows how many cards are scheduled, sorted by state:

- **New** cards have never been rated and are due immediately
- **Learning** cards are in the short steps between their first ratings
- **Review** cards have graduated and are scheduled for a later date
- **Relearning** cards were forgotten and are going through the steps again

Underneath, "Answer with" lets you choose whether the term or the definition is shown first. This is the same choice as when studying with [Flashcards](/usage/flashcards): if "Definition" is selected as the answer, the term is presented first, and vice versa.

If nothing is due, the screen states this, and the upcoming reviews section shows when cards are due next: within the next 4 hours, 24 hours, 3 days, or 7 days.

## Reviewing cards

The currently shown card is flipped by clicking on it or by pressing the spacebar. After the flip, the card is rated with one of three buttons, or with the corresponding number keys:

- **Don't know (1)** - the card was not remembered and comes back soon
- **Took a while (2)** - the card was remembered, but with difficulty
- **Knew right away (3)** - the card was remembered easily

Cards rated as "Don't know" do not leave the session right away. They come back after another 4-12 cards have been learned, and keep coming back until they are rated differently. The counter at the bottom shows how many cards have been learned so far.

Ratings are applied immediately. Leaving a session in progress does not discard the ratings that were already made. The back arrow restarts the review with a freshly built queue, which now only contains the cards that are still due.

When all cards have been rated, a summary shows how many cards were rated with each option.

## How cards are scheduled

Every card has a due date and one of the four states listed above:

- Cards that have never been rated are new and due immediately, so newly created sets appear in the review right away.
- Rating a card schedules its next due date. Cards rated "Knew right away" are scheduled further into the future than cards rated "Took a while", and cards rated "Don't know" return through the short relearning steps.
- The intervals grow as cards are rated successfully over time, which is what keeps well-known cards away and struggling cards close.
- Cards that are due within the next few hours are part of the queue as well, so a session that starts earlier than the day before does not skip cards scheduled for exactly the time in between.

The queue always contains every card that is due. It is not limited to a daily amount, so a review is as long as the number of due cards.

## Review cadence

The "Review" section of the settings page contains a "How often do you learn?" option, ranging from "Four times a day" to "Once per week". This setting determines the rhythm of the short learning and relearning steps: the steps cards move through between their first ratings, and again after being rated "Don't know". It decides how long a card waits in each of these steps before it comes back, so the timing of your reviews is adjusted to match the cadence you choose.

The change applies immediately to cards that have not been studied yet. Cards that have already been studied keep their current due date until the next time they are reviewed.
