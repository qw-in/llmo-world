# LLMo World

> [!CAUTION]
>
> This project is still in the experimental phase. Everything is subject to
> change. Use for fun not production.

LLMo World is a tool for exploring how popular LLM-based assistants interact with the
web.

---

<a href="https://arcjet.com?ref=llmo-world" target="_blank" rel="noopener noreferrer">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://arcjet.com/logo/arcjet-dark-lockup-voyage-horizontal.svg">
    <img src="https://arcjet.com/logo/arcjet-light-lockup-voyage-horizontal.svg" alt="Arcjet Logo" height="128" width="auto">
  </picture>
</a>

A big thanks to [Arcjet](https://arcjet.com?ref=llmo-world) for supporting my work on this project!

## How it works

Start a server and host an html page with some hidden flags (one control & one
test). Then generate a prompt to search for the flags and log the results.
Repeat for enough agents and test cases until satisfied.

Everything is manual for now for maximum flexibility and compatibility but the
goal is to expand and automate where possible.

## What we've learned

So far this approach seems to work well!

| Test category                | ChatGPT /search | Copilot #fetch |
|------------------------------|-----------------|----------------|
| Server‑rendered text         | ✅               | ✅              |
| JS‑inserted content          | ❌               | ✅              |
| Literal `<script>` contents  | ❌               | ❌              |
| Literal `<style>` contents   | ❌               | ❌              |
| CSS hidden (`display: none`) | ✅               | ❌              |

## Using the CLI

> [!WARNING]
>
> This project requires Node.js 24.6 or later due to an issue with disposables
> in earlier versions. If you can run the tests, you're good to go.


```sh
node src/cli.ts --help
```
