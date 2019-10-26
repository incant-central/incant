# Vision

## Data-Oriented Scripting

What if we could script with data? One challenge with traditional shell scripting is that, until now, there hasn't been any proper data notation for the shell. Sure, Bash 4 introduced a few new data structures but they lack support across the board and the notation has almost zero ergonomics. Practically speaking, when dealing with shell scripting, all inputs and outputs are effectively just byte-streams, or strings. You'll need to go out of your way if you want to pretend that you're working with anything else.

Incant is built atop a new data notation called PDN. PDN is a data notation which aims to be ergonomic and friendly enough that it can be surfaced all the way to the command-line. This allows for an entirely new approach to the command-line interface. Incant uses PDN notation, extended by Sota, to provide a truly unique command-line experience that you're sure to fall in love with. Once you've seen the light, you'll never want to go back.

## Component-Based Scripting

After spending a few hours on Stackoverflow you've finally conconcted the appropriate shell incantation to allow you to recover your git stash entries that were cleared/dropped erroneously.

It looks like this:

```
git fsck --unreachable |
grep commit | cut -d\  -f3 |
xargs git log --merges --no-walk --grep=WIP
```

So, you stick it in a file somewhere on your `$PATH`, `chmod +x` it and you have something reusable. Great.

Suzi see you using it one day and wants it. So, you slack it to her. Great.

Word is out and now everyone in your org wants to have this little gem at the ready. So, you stick in a git repo and share the link in `#general`. Great.

Fine. That all works—but all that manual sharing means everyone's version is drifting as folks tweak the script. Also, it wasn't entirely frictionless to get those 3 lines shared out.

```
@[{fsck {unreachable true}} git.fsck]
@[{pattern commit} grep]
@[{d \ f 3} cut]
@[{--.$ $ merges true no-walk true grep WIP} git.log]
```
