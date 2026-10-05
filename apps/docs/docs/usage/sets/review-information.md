---
sidebar_position: 5
---

# Review Information

When you open a study set that you created, each card shows a small bar chart icon at its right edge, next to the definition. Opening it displays the "Review information" popup: a summary of how that individual card has been doing in your reviews.

The popup uses the same data as the spaced repetition [Review](/usage/review) feature, which makes it a handy way to check up on a single card without starting a review. It is read-only - nothing you do inside of it changes the card or its schedule.

:::info
Review progress is personal and belongs to the user who reviewed the cards. The icon is therefore only shown on sets that you have created, and only while the cards are not being edited.
:::

## Opening the popup

How the popup opens depends on your device:

- **Computers** - hovering over the icon shows the popup next to the card. Click the icon to keep it open, and click it again to close it. Moving the mouse away from the icon closes it as well.
- **Phones and tablets** - tapping the icon opens the popup as a dialog in the middle of the screen. Tap the X in its corner to close it.

The icon itself is colored by the rating that the card has received the most, so you can see how a card is doing before even opening the popup:

- **Red** - mostly rated "Don't know"
- **Yellow** - mostly rated "Took a while"
- **Green** - mostly rated "Got it"

Cards that have not been reviewed yet keep the standard color.

## What the popup shows

### Schedule

At the top, a pill shows when the card is due next, for example "New", "Due now", or "Due in 3 days". Underneath it, the exact date and time are shown:

- **Scheduled for** - the date and time the card is due at
- **Was due** - the date and time the card was due at, which has already passed, so the card comes back in your next review
- **This card has not been reviewed yet** - the card is new and is due immediately

### Ratings

The "Ratings" section counts every rating that the card has received so far, shown as a bar with three colors and a legend underneath. Each row of the legend shows a rating, how many times you chose it (for example "3x"), and the percentage of all reviews it makes up.

The three ratings are the same ones you give to cards during a review:

- **Don't know** - the card was forgotten
- **Took a while** - the card was remembered, but with difficulty
- **Got it** - the card was remembered easily

A bar with mostly green and no red is a good sign. A wide red segment means the card keeps being forgotten, which is why it keeps coming back in your reviews.

### Review history

The "Review history" section shows one bar per review, arranged from the first review on the left to the most recent review on the right. Hovering over a bar shows the date of the review, the rating you gave, and when the card came back afterwards.

The height of a bar shows how far into the future that review scheduled the card. Bars that grow taller over time mean the intervals are stretching, which happens as you keep remembering the card. Underneath the chart, the date range of the shown reviews is displayed.

:::info
Only the most recent 50 reviews of a card are kept in the chart. The "Reviews" count underneath always reflects every review, and a note appears whenever the chart is only showing a subset of them.
:::

### Statistics

At the bottom, four numbers summarize the card:

- **State** - where the card currently is in its schedule: New, Learning, Review, or Relearning. See [Review](/usage/review) for what each state means.
- **Reviews** - how many times the card has been rated in total
- **Lapses** - how many times the card was forgotten after it had already been learned
- **Retention** - the share of reviews in which the card was not rated "Don't know". 100% means the card has never been forgotten.
