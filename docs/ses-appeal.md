# SES production access: the appeal

Amazon turned down the first request (case 179259658200056, eu-west-1). Reply
on that case in the AWS console (Support → Your support cases → the case →
Reply), or open a new one: Service limit increase → SES Sending Limits →
eu-west-1. Paste the text below as is.

---

Hello,

Thank you for reviewing our request. Here is the detail you need about how we
will use Amazon SES in eu-west-1.

**Who we are.** GRIND STUDIO (FFUNK Media LLC) sells digital music products
(MIDI packs for music producers) at https://m.thegrind.studio. Our sending
domain thegrind.studio is verified with DKIM. We send from
support@thegrind.studio, a real inbox we answer.

**What we send.**
1. Transactional email (most of the volume at first): the receipt with
   download links after a purchase, sign-in links for our customer download
   page (m.thegrind.studio/account), and one reminder to someone who started
   our checkout and gave their email but did not pay.
2. A newsletter to our own list: about 4,000 people who signed up on our
   pages or bought from us. We have been sending it for years from our
   current platform (ClickFunnels) and are moving it to SES. We never buy,
   rent or scrape addresses.

**Volume.** About 4,000 newsletter emails a day plus 50 to 200
transactional emails a day, so roughly 130,000 a month. A quota of 10,000 a
day and 14 per second covers it.

**How people get on the list.** Only by typing their own email on our sign-up
or checkout forms. Every address in our contact table records where it came
from (the form or the product).

**Unsubscribes.** Every newsletter email has an unsubscribe link in the
footer and List-Unsubscribe plus List-Unsubscribe-Post headers (one-click,
RFC 8058). An unsubscribe takes effect at once: the contact is marked
unsubscribed in our database and is skipped by every later send.
Transactional emails (receipts, sign-in links) are only sent to the person
who asked for them.

**Bounces and complaints.** The SES account-level suppression list is on for
bounces and complaints, so we never send to those addresses again. Before the
first newsletter from SES we import only contacts who are active and
subscribed on our current platform, which already removes hard bounces and
unsubscribes.

**Sample.** A receipt reads: "You're in. Your files are below. These links
don't expire," followed by a download button for each product, the order
number and amount, and our support address.

We are glad to answer any other question.

Thank you,
Mark Haven, GRIND STUDIO
support@thegrind.studio
