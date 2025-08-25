# LLMo World

> [!CAUTION]
>
> This project is still in the experimental phase. Everything is subject to
> change. Use for fun not production.

LLMo World is a tool for exploring how popular LLM-based tools interact with the
web.

## How it works

Start a server and host an html page with some hidden flags (one control & one
test). Then generate a prompt to search for the flags and log the results.
Repeat for enough agents and test cases until satisfied.

Everything is manual for now for maxumum flexiblity and compatibility but the
goal is to expand and automate where possible.

## What we've learned

So far we've only scratched the surface but neither ChatGPT search not GitHub
copilot `#fetch` seem to be able to see content in `<script>` or `<style>` tags.
The test cases are not in `main` yet but it is also very likely they don't
executre JavaScript. Oh, and Copilot (web) seems to be unable to fetch live
URLs. Intead relying on Bings existing cached version

## Using the CLI

> [!WARNING]
>
> This project requires Node.js 24.6 or later due to an issue with disposables
> in earlier versions. If you can run the tests, you're good to go.


```sh
node src/cli.ts --help
```