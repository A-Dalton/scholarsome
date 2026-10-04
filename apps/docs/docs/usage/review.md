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

Cards rated as "Don't know" are also stored in [Previous mistakes](/usage/previous-mistakes), just like the "Don't know" button of progressive flashcards. Each card is only recorded once per session, even if it is rated "Don't know" more than once.

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

Here is what each option means, and what each of the three answers does with the cards:

- **Four times a day** - you review about every six hours, and cards you are learning come back within the same day.
  - **Don't know** - the card moves into the first learning step and is due again after 3 hours. Rating it "Don't know" again repeats the same wait.
  - **Took a while** - the card stays in the learning steps, but is due a little later: roughly halfway between the 3-hour step and the next day, so about 13 hours.
  - **Knew right away** - the card skips the same-day steps and is due the next day. From then on, its intervals grow as usual.
- **Two times a day** - you review about every twelve hours, and the same-day waits stretch accordingly.
  - **Don't know** - the card moves into the first learning step and is due again after 6 hours. Rating it "Don't know" again repeats the same wait.
  - **Took a while** - the card stays in the learning steps, but is due a little later: roughly halfway between the 6-hour step and the next day, so about 15 hours.
  - **Knew right away** - the card skips the same-day steps and is due the next day. From then on, its intervals grow as usual.
- **Once per day** - you review every day.
  - **Don't know** - the card is due again the next day and comes back in your next review.
  - **Took a while** - the card waits a little longer than "Don't know".
  - **Knew right away** - the longest wait, so the card comes back when it is close to being forgotten.
- **Every two days** - you review every other day.
  - **Don't know** - the card is due again the next day, but your next review is two days later, so it comes back then.
  - **Took a while** - the card waits a little longer than "Don't know".
  - **Knew right away** - the longest wait, so the card comes back when it is close to being forgotten.
- **Every four days** - you review every four days.
  - **Don't know** - the card is due again the next day, but your next review is four days later, so it comes back then.
  - **Took a while** - the card waits a little longer than "Don't know".
  - **Knew right away** - the longest wait, so the card comes back when it is close to being forgotten.
- **Once per week** - you review once a week.
  - **Don't know** - the card is due again the next day, but your next review is a week later, so it comes back then.
  - **Took a while** - the card waits a little longer than "Don't know".
  - **Knew right away** - the longest wait, so the card comes back when it is close to being forgotten.

When a card that has already graduated is rated "Don't know", it goes through a relearning step first: 3 hours with "Four times a day" and 6 hours with "Two times a day". While it relearns, "Don't know" repeats that step, "Took a while" stretches the wait to one and a half times the step, and "Knew right away" ends the relearning and returns the card to its normal schedule.

The options from "Once per day" on schedule the same way: a card is due the next day at the earliest, and since cards are never due within hours of a session, every review picks up everything that has come due in the meantime. A card that is already due therefore reappears in your next review, not necessarily the next day. The choice between them is about how often you plan to sit down and review.

The change applies immediately to cards that have not been studied yet. Cards that have already been studied keep their current due date until the next time they are reviewed.
