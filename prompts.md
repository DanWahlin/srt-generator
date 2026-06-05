# Session prompts

This file captures the user prompts from the current session, in order.

1. "i need to create a caption file (.srt) for the @screenflow/mai-code-1-flash.mp4 video. I have tools available to help with that. Can you generate the file?"
2. "No - I have a local tool that can be used to do it."
3. "Something about whisper I think"
4. "I need an easy way to generate srt caption files (as a separate file) and to also embed them in videos. CAn you do this?\n\n1. Research if there's an existing OSS CLI type of tool that we could use for this.\n2. If not, let me know about a high-level plan for creating it if needed. I'd prefer to use something that's already in existence though."
5. "Create a plan for creating a cli. Store it in \"~/Desktop/Projects/srt-generator/.plans\". I need to be able to run it and generate only an srt file OR an srt file + the srt embedded mp4 file. It should wraps existing tools. Include a readme for the specific steps needed to install the required tools as well as the new cli wrapper tool. If possible, it'd be great to make this cross platform so it can run on Mac/Windows/Linux."
6. "Yes - implement the wrapper"
7. "What is \"--model\"?"
8. "Is this all documented well in the project's readme?"
9. "Run the new srt cli against this mp4: /Users/danwahlin/Desktop/screenflow/mai-code-1-flash.mp4\n\nI'd like it to generate the srt file and the embedded mp4. The original mp4 should be left alone of course, so let's make sure that the embedded srt mp4 has a new name. Maybe add \"-srt\" at the end of the file name."
10. "Review: my code changes"
11. "Does the tool automatically leave alone the original video? I'd like that to be the default. In cases where we want to update the original video with the embedded srt, could we have a command line flag?"
12. "Make sure the readme is updated with all of the comnand line flags"
13. "Commit changes. Create a private repo for my DanWahlin account and push."
14. "Use the skill tool to invoke the \"humanizer\" skill, then follow the skill's instructions to help with: Based on all of the prompts in this session, the code generated, etc. I'd like you to write a blog post about this project and how the MAI-Code-1-Flash model was used. That's the highlight of the post was using that model, prompts used, what was built, what the cli tool does, flags, etc. to show that a Flash model like this can be used for useful tasks. Store it in the srt-generator project here under \"blogs\" directory. Once done, use the skill to humanize it and make it flow really well so it reads like a solid blog post. Keep it under 1500 words."
15. "Can you save all of the prompts used in this session to the project as prompts.md?"
