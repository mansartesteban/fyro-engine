/**
 * @version 0.0.1
 * @author Esteban MANSART <esteban.mansart@gmail.com>
 * @description A CLI helper which parse command line options and reorganize the to a readable object with correct values
 */

class CLI {
	static #defined_options = [];
	static #parsed_options = [];
	static #computed_options = {};
	static #argv = [];
	static #pointer = 0;
	static #command = ""

    static display = console

	/**
	 * Process function which have to be called after all options has been defined with defineOption method.
	 * It will handle the transformation from CLI options to datas accessible with CLI.options attribute
	 */
	static process(argv = []) {

		console.log("process", argv)
		this.#argv = argv;
		this.#addHelp();
		
		this.#parseOptions();
		this.#computeOptions();
		
		if (this.options.help) {
			this.displayHelp(this.options.help);
		}
	}

	/**
	 * Private method to define help option and attach its description
	 */
	static #addHelp() {
		this.defineOption(["help", "h"], false, "help");
		this.attachDescription("help", {
			en: "Display this help panel. Language can be changed with <lang> value (supported : fr, en)",
			fr: "Affiche ce panneau d'aide. La langue peut Ãªtre changÃ© avec l'option <lang> (supportÃ© : fr, en)",
		});
	}

	/**
	 * A public getter with transformed CLI options to readable datas
	 */
	static get options() {
		return this.#computed_options;
	}

	/**
	 * Return the processed value a a given option.
	 * @param {string} option_name The name defined by the 3rd parameters in CLI.defineOption method
	 * @returns
	 */
	static getOption(option_name = "") {
		return this.options[option_name];
	}

	/**
	 * 
	 */
	static getCommand() {
		return this.#command
	}

	/**
	 * Define options to handle while processing with their own behaviour
	 * @param {string[]} tokens Multiple string to be catched as the same option => ['p', 'path'] means that "-p", "-path", "--p", "--path" will be interpreted as the same parameter
	 * @param {any} default_value The default value of the option if not found in CLI options
	 * @param {string} name The name of the value to be return. Will be accessible as CLI.options[name]
	 */
	static defineOption(tokens = [], default_value = "", name = "") {
		if (tokens.length === 0) {
			throw "Unable to define option, it must have a valid token";
		}
		if (!name) {
			throw "Please provide a name to your option";
		}
		if (default_value === true) {
			throw "Boolean option cannot be set to true as default value. Define it to false then is the option exists on execution it will be set to true";
		}

		if (!Array.isArray(tokens)) {
			tokens = [tokens];
		}

		// If all good, add the defined option to a list with more details
		if (tokens.length > 0) {
			this.#defined_options.push({ tokens, default_value, name });
		}
	}

	/**
	 * Internal function which parse CLI option and store it to a temporary easier object
	 */
	static #parseOptions() {
		// While there is options to process
		while (this.#argv[this.#pointer]) {
			let arg = this.#argv[this.#pointer];

			if (this.#pointer === 0) {
				this.#command = arg
				this.#pointer++
				continue
			}

			// If option starts with double dashed
			if (arg.substring(0, 2) === "--") {
				this.#parseDoubleDashOption(arg);
			}

			// If option starts with simple dash
			else if (arg.substring(0, 1) === "-") {
				this.#parseSimpleDashOption(arg);
			}

			// Next option
			this.#pointer++;
		}
	}

	/**
	 * Internal function which associate values of defined option with the temporary option object created in CLI.#parseOptions
	 * @private
	 */
	static #computeOptions() {
		// Loop through defined option
		this.#defined_options.forEach((defined_option) => {
			let found_index = Object.keys(this.#parsed_options).findIndex((parsed_option_key) =>
				defined_option.tokens.includes(parsed_option_key)
			);

			// If option has been found in the parsed option
			if (found_index >= 0) {
				// If the default value of the option is false, we consider it to be a Boolean option (i.e. if present = true, if absent = false)
				// So if we have false as default value and option is present, we set it to true
				if (defined_option.default_value === false) {
					this.#computed_options[defined_option.name] =
						Object.values(this.#parsed_options)[found_index] ?? true;
				}

				// If the default value is something else than false, we just retrieve the parsed value and add it to computed value
				else {
					this.#computed_options[defined_option.name] = Object.values(this.#parsed_options)[found_index];
				}
			}

			// If option has not been found in the parsed options
			else {
				// Associates default defined value to computed option
				this.#computed_options[defined_option.name] = defined_option.default_value;
			}
		});
	}

	/**
	 * The isolated option to process (option which starts with double dashed)
	 * @param {string} arg
	 */
	static #parseDoubleDashOption(arg = null) {
		arg = arg.substring(2);
		if (arg.includes("=")) {
			arg = arg.split("=");
			this.#parsed_options[arg[0]] = arg[1];
		}
		// If the next option doesn't start with a dash, it means that this is the value of current option
		else if (this.#argv[this.#pointer + 1] && !this.#argv[this.#pointer + 1].startsWith("-")) {
			// Si we add the next option as value of current
			this.#parsed_options[arg] = this.#argv[this.#pointer + 1] || null;
			// And we skip next option for processing
			this.#pointer++;
		} else {
			this.#parsed_options[arg] = true;
		}
	}

	/**
	 * The isolated option to process (option which starts with simple dash)
	 * @param {string} arg
	 */
	static #parseSimpleDashOption(arg = null) {
		arg = arg.substring(1);

		// If the next option doesn't start with a dash, it means that this is the value of current option
		if (this.#argv[this.#pointer + 1] && !this.#argv[this.#pointer + 1].startsWith("-")) {
			// Si we add the next option as value of current
			this.#parsed_options[arg] = this.#argv[this.#pointer + 1] || null;

			// And we skip next option for processing
			this.#pointer++;
		}

		// If next option starts with dash, we are in the case of short options (-p, -r, -f or -prf)
		else {
			// So we split potential multiple shortten options
			arg = arg.split("");

			// And add them all individually to parsed arguements
			arg.forEach((splitted_arg) => {
				this.#parsed_options[splitted_arg] = true;
			});
		}
	}

	/**
	 *
	 * @param {string} lang Language in which display the help panel
	 */
	static displayHelp(lang = "en") {
		// Display different message depending on the language
		if (lang === "fr") {
			this.display.info("Utilisation : pnpm app-check-encoding <options>");
		} else {
			this.display.info("Usage: pnpm app-check-encoding <options>");
		}

		// If options exists
		if (this.#defined_options.length > 0) {
			this.display.info("\nOptions :\n");

			// Sort alphabetically options by name
			let defined_options = this.#defined_options.sort((a, b) => a.name.localeCompare(b.name));
			let max_length = 0;
			let tokens = [];

			// Loop through all tokens to determinates the length to calculate the blanks spaces for alignments
			defined_options.forEach((option, index) => {
				tokens.push(option.tokens.map((token) => (token.length === 1 ? "-" + token : "--" + token)).join(", "));
				max_length = Math.max(max_length, tokens[index].length);
			});

			// Loop through all options to display descriptions
			defined_options.forEach((option, index) => {
				display.info(
					"\x1B[35m" +
						tokens[index].padEnd(max_length + 4 + (max_length % 4), " ") +
						"\x1b[0m" +
						option.__help__[lang === true ? "en" : lang]
				);
			});
		}
	}

	/**
	 * Permits to attach a description on a given option by name
	 * @param {string} option_name The name of the option to be attached
	 * @param {*} description An object containing descriptions in all languages. As key, the id of the language (en, fr, pt), as value a string containing the description
	 */
	static attachDescription(option_name = "", description = null) {
		if (!option_name) {
			throw "You must provide an option name to add help description";
		}

		if (!description) {
			throw "You must provide a description to add help description";
		}

		// Find the corresponding option by name and add the description object
		let option_found = this.#defined_options.find((option) => option.name === option_name);
		if (option_found) {
			option_found.__help__ = description;
		}
	}

	static reset() {
		this.#parsed_options = [];
		this.#defined_options = [];
		this.#computed_options = {};
		this.#pointer = 0;
		this.defineOption(["help"], false, "help");
	}
}

export default CLI;

/*
TODO:
- Les options commençant par un tiret simple ne devraient pas être intereprétées comme des mots mais comme des ensemble de lettre
- Prendre en compte le majuscules/minuscules
 */