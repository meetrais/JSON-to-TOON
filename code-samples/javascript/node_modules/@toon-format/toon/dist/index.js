//#region src/constants.ts
const LIST_ITEM_MARKER = "-";
const LIST_ITEM_PREFIX = "- ";
const COMMA = ",";
const COLON = ":";
const SPACE = " ";
const PIPE = "|";
const DOT = ".";
const OPEN_BRACKET = "[";
const CLOSE_BRACKET = "]";
const OPEN_BRACE = "{";
const CLOSE_BRACE = "}";
const NULL_LITERAL = "null";
const TRUE_LITERAL = "true";
const FALSE_LITERAL = "false";
const BACKSLASH = "\\";
const DOUBLE_QUOTE = "\"";
const NEWLINE = "\n";
const CARRIAGE_RETURN = "\r";
const TAB = "	";
const DELIMITERS = {
	comma: COMMA,
	tab: TAB,
	pipe: PIPE
};
const DEFAULT_DELIMITER = DELIMITERS.comma;

//#endregion
//#region src/shared/string-utils.ts
/**
* Escapes special characters in a string for encoding.
*
* @remarks
* Handles backslashes, quotes, newlines, carriage returns, and tabs.
*/
function escapeString(value) {
	return value.replace(/\\/g, `${BACKSLASH}${BACKSLASH}`).replace(/"/g, `${BACKSLASH}${DOUBLE_QUOTE}`).replace(/\n/g, `${BACKSLASH}n`).replace(/\r/g, `${BACKSLASH}r`).replace(/\t/g, `${BACKSLASH}t`);
}
/**
* Unescapes a string by processing escape sequences.
*
* @remarks
* Handles `\n`, `\t`, `\r`, `\\`, and `\"` escape sequences.
*/
function unescapeString(value) {
	let unescaped = "";
	let i = 0;
	while (i < value.length) {
		if (value[i] === BACKSLASH) {
			if (i + 1 >= value.length) throw new SyntaxError("Invalid escape sequence: backslash at end of string");
			const next = value[i + 1];
			if (next === "n") {
				unescaped += NEWLINE;
				i += 2;
				continue;
			}
			if (next === "t") {
				unescaped += TAB;
				i += 2;
				continue;
			}
			if (next === "r") {
				unescaped += CARRIAGE_RETURN;
				i += 2;
				continue;
			}
			if (next === BACKSLASH) {
				unescaped += BACKSLASH;
				i += 2;
				continue;
			}
			if (next === DOUBLE_QUOTE) {
				unescaped += DOUBLE_QUOTE;
				i += 2;
				continue;
			}
			throw new SyntaxError(`Invalid escape sequence: \\${next}`);
		}
		unescaped += value[i];
		i++;
	}
	return unescaped;
}
/**
* Finds the index of the closing double quote, accounting for escape sequences.
*/
function findClosingQuote(content, start) {
	let i = start + 1;
	while (i < content.length) {
		if (content[i] === BACKSLASH && i + 1 < content.length) {
			i += 2;
			continue;
		}
		if (content[i] === DOUBLE_QUOTE) return i;
		i++;
	}
	return -1;
}
/**
* Finds the index of a character outside of quoted sections.
*/
function findUnquotedChar(content, char, start = 0) {
	let inQuotes = false;
	let i = start;
	while (i < content.length) {
		if (content[i] === BACKSLASH && i + 1 < content.length && inQuotes) {
			i += 2;
			continue;
		}
		if (content[i] === DOUBLE_QUOTE) {
			inQuotes = !inQuotes;
			i++;
			continue;
		}
		if (content[i] === char && !inQuotes) return i;
		i++;
	}
	return -1;
}

//#endregion
//#region src/encode/normalize.ts
function normalizeValue(value) {
	if (value === null) return null;
	if (typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number") {
		if (Object.is(value, -0)) return 0;
		if (!Number.isFinite(value)) return null;
		return value;
	}
	if (typeof value === "bigint") {
		if (value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER) return Number(value);
		return value.toString();
	}
	if (value instanceof Date) return value.toISOString();
	if (Array.isArray(value)) return value.map(normalizeValue);
	if (value instanceof Set) return Array.from(value).map(normalizeValue);
	if (value instanceof Map) return Object.fromEntries(Array.from(value, ([k, v]) => [String(k), normalizeValue(v)]));
	if (isPlainObject(value)) {
		const normalized = {};
		for (const key in value) if (Object.prototype.hasOwnProperty.call(value, key)) normalized[key] = normalizeValue(value[key]);
		return normalized;
	}
	return null;
}
function isJsonPrimitive(value) {
	return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function isJsonArray(value) {
	return Array.isArray(value);
}
function isJsonObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isEmptyObject(value) {
	return Object.keys(value).length === 0;
}
function isPlainObject(value) {
	if (value === null || typeof value !== "object") return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}
function isArrayOfPrimitives(value) {
	return value.length === 0 || value.every((item) => isJsonPrimitive(item));
}
function isArrayOfArrays(value) {
	return value.length === 0 || value.every((item) => isJsonArray(item));
}
function isArrayOfObjects(value) {
	return value.length === 0 || value.every((item) => isJsonObject(item));
}

//#endregion
//#region src/shared/literal-utils.ts
function isBooleanOrNullLiteral(token) {
	return token === TRUE_LITERAL || token === FALSE_LITERAL || token === NULL_LITERAL;
}
/**
* Checks if a token represents a valid numeric literal.
*
* @remarks
* Rejects numbers with leading zeros (except `"0"` itself or decimals like `"0.5"`).
*/
function isNumericLiteral(token) {
	if (!token) return false;
	if (token.length > 1 && token[0] === "0" && token[1] !== ".") return false;
	const numericValue = Number(token);
	return !Number.isNaN(numericValue) && Number.isFinite(numericValue);
}

//#endregion
//#region src/shared/validation.ts
/**
* Checks if a key can be used without quotes.
*
* @remarks
* Valid unquoted keys must start with a letter or underscore,
* followed by letters, digits, underscores, or dots.
*/
function isValidUnquotedKey(key) {
	return /^[A-Z_][\w.]*$/i.test(key);
}
/**
* Checks if a key segment is a valid identifier for safe folding/expansion.
*
* @remarks
* Identifier segments are more restrictive than unquoted keys:
* - Must start with a letter or underscore
* - Followed only by letters, digits, or underscores (no dots)
* - Used for safe key folding and path expansion
*/
function isIdentifierSegment(key) {
	return /^[A-Z_]\w*$/i.test(key);
}
/**
* Determines if a string value can be safely encoded without quotes.
*
* @remarks
* A string needs quoting if it:
* - Is empty
* - Has leading or trailing whitespace
* - Could be confused with a literal (boolean, null, number)
* - Contains structural characters (colons, brackets, braces)
* - Contains quotes or backslashes (need escaping)
* - Contains control characters (newlines, tabs, etc.)
* - Contains the active delimiter
* - Starts with a list marker (hyphen)
*/
function isSafeUnquoted(value, delimiter = DEFAULT_DELIMITER) {
	if (!value) return false;
	if (value !== value.trim()) return false;
	if (isBooleanOrNullLiteral(value) || isNumericLike(value)) return false;
	if (value.includes(":")) return false;
	if (value.includes("\"") || value.includes("\\")) return false;
	if (/[[\]{}]/.test(value)) return false;
	if (/[\n\r\t]/.test(value)) return false;
	if (value.includes(delimiter)) return false;
	if (value.startsWith(LIST_ITEM_MARKER)) return false;
	return true;
}
/**
* Checks if a string looks like a number.
*
* @remarks
* Match numbers like `42`, `-3.14`, `1e-6`, `05`, etc.
*/
function isNumericLike(value) {
	return /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) || /^0\d+$/.test(value);
}

//#endregion
//#region src/decode/expand.ts
/**
* Symbol used to mark object keys that were originally quoted in the TOON source.
* Quoted dotted keys should not be expanded, even if they meet expansion criteria.
*/
const QUOTED_KEY_MARKER = Symbol("quotedKey");
function canMerge(a, b) {
	return isJsonObject(a) && isJsonObject(b);
}
/**
* Expands dotted keys into nested objects in safe mode.
*
* @remarks
* This function recursively traverses a decoded TOON value and expands any keys
* containing dots (`.`) into nested object structures, provided all segments
* are valid identifiers.
*
* Expansion rules:
* - Keys containing dots are split into segments
* - All segments must pass `isIdentifierSegment` validation
* - Non-eligible keys (with special characters) are left as literal dotted keys
* - Deep merge: When multiple dotted keys expand to the same path, their values are merged if both are objects
* - Conflict handling:
*   - `strict=true`: Throws TypeError on conflicts (non-object collision)
*   - `strict=false`: LWW (silent overwrite)
*
* @param value - The decoded value to expand
* @param strict - Whether to throw errors on conflicts
* @returns The expanded value with dotted keys reconstructed as nested objects
* @throws TypeError if conflicts occur in strict mode
*/
function expandPathsSafe(value, strict) {
	if (Array.isArray(value)) return value.map((item) => expandPathsSafe(item, strict));
	if (isJsonObject(value)) {
		const expandedObject = {};
		const quotedKeys = value[QUOTED_KEY_MARKER];
		for (const [key, keyValue] of Object.entries(value)) {
			const isQuoted = quotedKeys?.has(key);
			if (key.includes(DOT) && !isQuoted) {
				const segments = key.split(DOT);
				if (segments.every((seg) => isIdentifierSegment(seg))) {
					insertPathSafe(expandedObject, segments, expandPathsSafe(keyValue, strict), strict);
					continue;
				}
			}
			const expandedValue = expandPathsSafe(keyValue, strict);
			if (key in expandedObject) {
				const conflictingValue = expandedObject[key];
				if (canMerge(conflictingValue, expandedValue)) mergeObjects(conflictingValue, expandedValue, strict);
				else {
					if (strict) throw new TypeError(`Path expansion conflict at key "${key}": cannot merge ${typeof conflictingValue} with ${typeof expandedValue}`);
					expandedObject[key] = expandedValue;
				}
			} else expandedObject[key] = expandedValue;
		}
		return expandedObject;
	}
	return value;
}
/**
* Inserts a value at a nested path, creating intermediate objects as needed.
*
* @remarks
* This function walks the segment path, creating nested objects as needed.
* When an existing value is encountered:
* - If both are objects: deep merge (continue insertion)
* - If values differ: conflict
*   - strict=true: throw TypeError
*   - strict=false: overwrite with new value (LWW)
*
* @param target - The object to insert into
* @param segments - Array of path segments (e.g., ['data', 'metadata', 'items'])
* @param value - The value to insert at the end of the path
* @param strict - Whether to throw on conflicts
* @throws TypeError if a conflict occurs in strict mode
*/
function insertPathSafe(target, segments, value, strict) {
	let currentNode = target;
	for (let i = 0; i < segments.length - 1; i++) {
		const currentSegment = segments[i];
		const segmentValue = currentNode[currentSegment];
		if (segmentValue === void 0) {
			const newObj = {};
			currentNode[currentSegment] = newObj;
			currentNode = newObj;
		} else if (isJsonObject(segmentValue)) currentNode = segmentValue;
		else {
			if (strict) throw new TypeError(`Path expansion conflict at segment "${currentSegment}": expected object but found ${typeof segmentValue}`);
			const newObj = {};
			currentNode[currentSegment] = newObj;
			currentNode = newObj;
		}
	}
	const lastSeg = segments[segments.length - 1];
	const destinationValue = currentNode[lastSeg];
	if (destinationValue === void 0) currentNode[lastSeg] = value;
	else if (canMerge(destinationValue, value)) mergeObjects(destinationValue, value, strict);
	else {
		if (strict) throw new TypeError(`Path expansion conflict at key "${lastSeg}": cannot merge ${typeof destinationValue} with ${typeof value}`);
		currentNode[lastSeg] = value;
	}
}
/**
* Deep merges properties from source into target.
*
* @remarks
* For each key in source:
* - If key doesn't exist in target: copy it
* - If both values are objects: recursively merge
* - Otherwise: conflict (strict throws, non-strict overwrites)
*
* @param target - The target object to merge into
* @param source - The source object to merge from
* @param strict - Whether to throw on conflicts
* @throws TypeError if a conflict occurs in strict mode
*/
function mergeObjects(target, source, strict) {
	for (const [key, sourceValue] of Object.entries(source)) {
		const targetValue = target[key];
		if (targetValue === void 0) target[key] = sourceValue;
		else if (canMerge(targetValue, sourceValue)) mergeObjects(targetValue, sourceValue, strict);
		else {
			if (strict) throw new TypeError(`Path expansion conflict at key "${key}": cannot merge ${typeof targetValue} with ${typeof sourceValue}`);
			target[key] = sourceValue;
		}
	}
}

//#endregion
//#region src/decode/parser.ts
function parseArrayHeaderLine(content, defaultDelimiter) {
	const trimmed = content.trimStart();
	let bracketStart = -1;
	if (trimmed.startsWith(DOUBLE_QUOTE)) {
		const closingQuoteIndex = findClosingQuote(trimmed, 0);
		if (closingQuoteIndex === -1) return;
		if (!trimmed.slice(closingQuoteIndex + 1).startsWith(OPEN_BRACKET)) return;
		const keyEndIndex = content.length - trimmed.length + closingQuoteIndex + 1;
		bracketStart = content.indexOf(OPEN_BRACKET, keyEndIndex);
	} else bracketStart = content.indexOf(OPEN_BRACKET);
	if (bracketStart === -1) return;
	const bracketEnd = content.indexOf(CLOSE_BRACKET, bracketStart);
	if (bracketEnd === -1) return;
	let colonIndex = bracketEnd + 1;
	let braceEnd = colonIndex;
	const braceStart = content.indexOf(OPEN_BRACE, bracketEnd);
	if (braceStart !== -1 && braceStart < content.indexOf(COLON, bracketEnd)) {
		const foundBraceEnd = content.indexOf(CLOSE_BRACE, braceStart);
		if (foundBraceEnd !== -1) braceEnd = foundBraceEnd + 1;
	}
	colonIndex = content.indexOf(COLON, Math.max(bracketEnd, braceEnd));
	if (colonIndex === -1) return;
	let key;
	if (bracketStart > 0) {
		const rawKey = content.slice(0, bracketStart).trim();
		key = rawKey.startsWith(DOUBLE_QUOTE) ? parseStringLiteral(rawKey) : rawKey;
	}
	const afterColon = content.slice(colonIndex + 1).trim();
	const bracketContent = content.slice(bracketStart + 1, bracketEnd);
	let parsedBracket;
	try {
		parsedBracket = parseBracketSegment(bracketContent, defaultDelimiter);
	} catch {
		return;
	}
	const { length, delimiter } = parsedBracket;
	let fields;
	if (braceStart !== -1 && braceStart < colonIndex) {
		const foundBraceEnd = content.indexOf(CLOSE_BRACE, braceStart);
		if (foundBraceEnd !== -1 && foundBraceEnd < colonIndex) fields = parseDelimitedValues(content.slice(braceStart + 1, foundBraceEnd), delimiter).map((field) => parseStringLiteral(field.trim()));
	}
	return {
		header: {
			key,
			length,
			delimiter,
			fields
		},
		inlineValues: afterColon || void 0
	};
}
function parseBracketSegment(seg, defaultDelimiter) {
	let content = seg;
	let delimiter = defaultDelimiter;
	if (content.endsWith(TAB)) {
		delimiter = DELIMITERS.tab;
		content = content.slice(0, -1);
	} else if (content.endsWith(PIPE)) {
		delimiter = DELIMITERS.pipe;
		content = content.slice(0, -1);
	}
	const length = Number.parseInt(content, 10);
	if (Number.isNaN(length)) throw new TypeError(`Invalid array length: ${seg}`);
	return {
		length,
		delimiter
	};
}
/**
* Parses a delimited string into values, respecting quoted strings and escape sequences.
*
* @remarks
* Uses a state machine that tracks:
* - `inQuotes`: Whether we're inside a quoted string (to ignore delimiters)
* - `valueBuffer`: Accumulates characters for the current value
* - Escape sequences: Handled within quoted strings
*/
function parseDelimitedValues(input, delimiter) {
	const values = [];
	let valueBuffer = "";
	let inQuotes = false;
	let i = 0;
	while (i < input.length) {
		const char = input[i];
		if (char === BACKSLASH && i + 1 < input.length && inQuotes) {
			valueBuffer += char + input[i + 1];
			i += 2;
			continue;
		}
		if (char === DOUBLE_QUOTE) {
			inQuotes = !inQuotes;
			valueBuffer += char;
			i++;
			continue;
		}
		if (char === delimiter && !inQuotes) {
			values.push(valueBuffer.trim());
			valueBuffer = "";
			i++;
			continue;
		}
		valueBuffer += char;
		i++;
	}
	if (valueBuffer || values.length > 0) values.push(valueBuffer.trim());
	return values;
}
function mapRowValuesToPrimitives(values) {
	return values.map((v) => parsePrimitiveToken(v));
}
function parsePrimitiveToken(token) {
	const trimmed = token.trim();
	if (!trimmed) return "";
	if (trimmed.startsWith(DOUBLE_QUOTE)) return parseStringLiteral(trimmed);
	if (isBooleanOrNullLiteral(trimmed)) {
		if (trimmed === TRUE_LITERAL) return true;
		if (trimmed === FALSE_LITERAL) return false;
		if (trimmed === NULL_LITERAL) return null;
	}
	if (isNumericLiteral(trimmed)) {
		const parsedNumber = Number.parseFloat(trimmed);
		return Object.is(parsedNumber, -0) ? 0 : parsedNumber;
	}
	return trimmed;
}
function parseStringLiteral(token) {
	const trimmedToken = token.trim();
	if (trimmedToken.startsWith(DOUBLE_QUOTE)) {
		const closingQuoteIndex = findClosingQuote(trimmedToken, 0);
		if (closingQuoteIndex === -1) throw new SyntaxError("Unterminated string: missing closing quote");
		if (closingQuoteIndex !== trimmedToken.length - 1) throw new SyntaxError("Unexpected characters after closing quote");
		return unescapeString(trimmedToken.slice(1, closingQuoteIndex));
	}
	return trimmedToken;
}
function parseUnquotedKey(content, start) {
	let parsePosition = start;
	while (parsePosition < content.length && content[parsePosition] !== COLON) parsePosition++;
	if (parsePosition >= content.length || content[parsePosition] !== COLON) throw new SyntaxError("Missing colon after key");
	const key = content.slice(start, parsePosition).trim();
	parsePosition++;
	return {
		key,
		end: parsePosition
	};
}
function parseQuotedKey(content, start) {
	const closingQuoteIndex = findClosingQuote(content, start);
	if (closingQuoteIndex === -1) throw new SyntaxError("Unterminated quoted key");
	const key = unescapeString(content.slice(start + 1, closingQuoteIndex));
	let parsePosition = closingQuoteIndex + 1;
	if (parsePosition >= content.length || content[parsePosition] !== COLON) throw new SyntaxError("Missing colon after key");
	parsePosition++;
	return {
		key,
		end: parsePosition
	};
}
function parseKeyToken(content, start) {
	const isQuoted = content[start] === DOUBLE_QUOTE;
	return {
		...isQuoted ? parseQuotedKey(content, start) : parseUnquotedKey(content, start),
		isQuoted
	};
}
function isArrayHeaderAfterHyphen(content) {
	return content.trim().startsWith(OPEN_BRACKET) && findUnquotedChar(content, COLON) !== -1;
}
function isObjectFirstFieldAfterHyphen(content) {
	return findUnquotedChar(content, COLON) !== -1;
}

//#endregion
//#region src/decode/validation.ts
/**
* Asserts that the actual count matches the expected count in strict mode.
*/
function assertExpectedCount(actual, expected, itemType, options) {
	if (options.strict && actual !== expected) throw new RangeError(`Expected ${expected} ${itemType}, but got ${actual}`);
}
/**
* Validates that there are no extra list items beyond the expected count.
*/
function validateNoExtraListItems(cursor, itemDepth, expectedCount) {
	const nextLine = cursor.peek();
	if (nextLine?.depth === itemDepth && nextLine.content.startsWith(LIST_ITEM_PREFIX)) throw new RangeError(`Expected ${expectedCount} list array items, but found more`);
}
/**
* Validates that there are no extra tabular rows beyond the expected count.
*/
function validateNoExtraTabularRows(cursor, rowDepth, header) {
	const nextLine = cursor.peek();
	if (nextLine?.depth === rowDepth && !nextLine.content.startsWith(LIST_ITEM_PREFIX) && isDataRow(nextLine.content, header.delimiter)) throw new RangeError(`Expected ${header.length} tabular rows, but found more`);
}
/**
* Validates that there are no blank lines within a specific line range in strict mode.
*/
function validateNoBlankLinesInRange(startLine, endLine, blankLines, strict, context) {
	if (!strict) return;
	const firstBlank = blankLines.find((blank) => blank.lineNumber > startLine && blank.lineNumber < endLine);
	if (firstBlank) throw new SyntaxError(`Line ${firstBlank.lineNumber}: Blank lines inside ${context} are not allowed in strict mode`);
}
/**
* Checks if a line is a data row (vs a key-value pair) in a tabular array.
*/
function isDataRow(content, delimiter) {
	const colonPos = content.indexOf(COLON);
	const delimiterPos = content.indexOf(delimiter);
	if (colonPos === -1) return true;
	if (delimiterPos !== -1 && delimiterPos < colonPos) return true;
	return false;
}

//#endregion
//#region src/decode/decoders.ts
function decodeValueFromLines(cursor, options) {
	const first = cursor.peek();
	if (!first) throw new ReferenceError("No content to decode");
	if (isArrayHeaderAfterHyphen(first.content)) {
		const headerInfo = parseArrayHeaderLine(first.content, DEFAULT_DELIMITER);
		if (headerInfo) {
			cursor.advance();
			return decodeArrayFromHeader(headerInfo.header, headerInfo.inlineValues, cursor, 0, options);
		}
	}
	if (cursor.length === 1 && !isKeyValueLine(first)) return parsePrimitiveToken(first.content.trim());
	return decodeObject(cursor, 0, options);
}
function isKeyValueLine(line) {
	const content = line.content;
	if (content.startsWith("\"")) {
		const closingQuoteIndex = findClosingQuote(content, 0);
		if (closingQuoteIndex === -1) return false;
		return content.slice(closingQuoteIndex + 1).includes(COLON);
	} else return content.includes(COLON);
}
function decodeObject(cursor, baseDepth, options) {
	const obj = {};
	const quotedKeys = /* @__PURE__ */ new Set();
	let computedDepth;
	while (!cursor.atEnd()) {
		const line = cursor.peek();
		if (!line || line.depth < baseDepth) break;
		if (computedDepth === void 0 && line.depth >= baseDepth) computedDepth = line.depth;
		if (line.depth === computedDepth) {
			cursor.advance();
			const { key, value, isQuoted } = decodeKeyValue(line.content, cursor, computedDepth, options);
			obj[key] = value;
			if (isQuoted && key.includes(DOT)) quotedKeys.add(key);
		} else break;
	}
	if (quotedKeys.size > 0) obj[QUOTED_KEY_MARKER] = quotedKeys;
	return obj;
}
function decodeKeyValue(content, cursor, baseDepth, options) {
	const arrayHeader = parseArrayHeaderLine(content, DEFAULT_DELIMITER);
	if (arrayHeader && arrayHeader.header.key) {
		const decodedValue = decodeArrayFromHeader(arrayHeader.header, arrayHeader.inlineValues, cursor, baseDepth, options);
		return {
			key: arrayHeader.header.key,
			value: decodedValue,
			followDepth: baseDepth + 1,
			isQuoted: false
		};
	}
	const { key, end, isQuoted } = parseKeyToken(content, 0);
	const rest = content.slice(end).trim();
	if (!rest) {
		const nextLine = cursor.peek();
		if (nextLine && nextLine.depth > baseDepth) return {
			key,
			value: decodeObject(cursor, baseDepth + 1, options),
			followDepth: baseDepth + 1,
			isQuoted
		};
		return {
			key,
			value: {},
			followDepth: baseDepth + 1,
			isQuoted
		};
	}
	return {
		key,
		value: parsePrimitiveToken(rest),
		followDepth: baseDepth + 1,
		isQuoted
	};
}
function decodeArrayFromHeader(header, inlineValues, cursor, baseDepth, options) {
	if (inlineValues) return decodeInlinePrimitiveArray(header, inlineValues, options);
	if (header.fields && header.fields.length > 0) return decodeTabularArray(header, cursor, baseDepth, options);
	return decodeListArray(header, cursor, baseDepth, options);
}
function decodeInlinePrimitiveArray(header, inlineValues, options) {
	if (!inlineValues.trim()) {
		assertExpectedCount(0, header.length, "inline array items", options);
		return [];
	}
	const primitives = mapRowValuesToPrimitives(parseDelimitedValues(inlineValues, header.delimiter));
	assertExpectedCount(primitives.length, header.length, "inline array items", options);
	return primitives;
}
function decodeListArray(header, cursor, baseDepth, options) {
	const items = [];
	const itemDepth = baseDepth + 1;
	let startLine;
	let endLine;
	while (!cursor.atEnd() && items.length < header.length) {
		const line = cursor.peek();
		if (!line || line.depth < itemDepth) break;
		const isListItem = line.content.startsWith(LIST_ITEM_PREFIX) || line.content === "-";
		if (line.depth === itemDepth && isListItem) {
			if (startLine === void 0) startLine = line.lineNumber;
			endLine = line.lineNumber;
			const item = decodeListItem(cursor, itemDepth, options);
			items.push(item);
			const currentLine = cursor.current();
			if (currentLine) endLine = currentLine.lineNumber;
		} else break;
	}
	assertExpectedCount(items.length, header.length, "list array items", options);
	if (options.strict && startLine !== void 0 && endLine !== void 0) validateNoBlankLinesInRange(startLine, endLine, cursor.getBlankLines(), options.strict, "list array");
	if (options.strict) validateNoExtraListItems(cursor, itemDepth, header.length);
	return items;
}
function decodeTabularArray(header, cursor, baseDepth, options) {
	const objects = [];
	const rowDepth = baseDepth + 1;
	let startLine;
	let endLine;
	while (!cursor.atEnd() && objects.length < header.length) {
		const line = cursor.peek();
		if (!line || line.depth < rowDepth) break;
		if (line.depth === rowDepth) {
			if (startLine === void 0) startLine = line.lineNumber;
			endLine = line.lineNumber;
			cursor.advance();
			const values = parseDelimitedValues(line.content, header.delimiter);
			assertExpectedCount(values.length, header.fields.length, "tabular row values", options);
			const primitives = mapRowValuesToPrimitives(values);
			const obj = {};
			for (let i = 0; i < header.fields.length; i++) obj[header.fields[i]] = primitives[i];
			objects.push(obj);
		} else break;
	}
	assertExpectedCount(objects.length, header.length, "tabular rows", options);
	if (options.strict && startLine !== void 0 && endLine !== void 0) validateNoBlankLinesInRange(startLine, endLine, cursor.getBlankLines(), options.strict, "tabular array");
	if (options.strict) validateNoExtraTabularRows(cursor, rowDepth, header);
	return objects;
}
function decodeListItem(cursor, baseDepth, options) {
	const line = cursor.next();
	if (!line) throw new ReferenceError("Expected list item");
	let afterHyphen;
	if (line.content === "-") return {};
	else if (line.content.startsWith(LIST_ITEM_PREFIX)) afterHyphen = line.content.slice(LIST_ITEM_PREFIX.length);
	else throw new SyntaxError(`Expected list item to start with "${LIST_ITEM_PREFIX}"`);
	if (!afterHyphen.trim()) return {};
	if (isArrayHeaderAfterHyphen(afterHyphen)) {
		const arrayHeader = parseArrayHeaderLine(afterHyphen, DEFAULT_DELIMITER);
		if (arrayHeader) return decodeArrayFromHeader(arrayHeader.header, arrayHeader.inlineValues, cursor, baseDepth, options);
	}
	if (isObjectFirstFieldAfterHyphen(afterHyphen)) return decodeObjectFromListItem(line, cursor, baseDepth, options);
	return parsePrimitiveToken(afterHyphen);
}
function decodeObjectFromListItem(firstLine, cursor, baseDepth, options) {
	const { key, value, followDepth, isQuoted } = decodeKeyValue(firstLine.content.slice(LIST_ITEM_PREFIX.length), cursor, baseDepth, options);
	const obj = { [key]: value };
	const quotedKeys = /* @__PURE__ */ new Set();
	if (isQuoted && key.includes(DOT)) quotedKeys.add(key);
	while (!cursor.atEnd()) {
		const line = cursor.peek();
		if (!line || line.depth < followDepth) break;
		if (line.depth === followDepth && !line.content.startsWith(LIST_ITEM_PREFIX)) {
			cursor.advance();
			const { key: k, value: v, isQuoted: kIsQuoted } = decodeKeyValue(line.content, cursor, followDepth, options);
			obj[k] = v;
			if (kIsQuoted && k.includes(DOT)) quotedKeys.add(k);
		} else break;
	}
	if (quotedKeys.size > 0) obj[QUOTED_KEY_MARKER] = quotedKeys;
	return obj;
}

//#endregion
//#region src/decode/scanner.ts
var LineCursor = class {
	lines;
	index;
	blankLines;
	constructor(lines, blankLines = []) {
		this.lines = lines;
		this.index = 0;
		this.blankLines = blankLines;
	}
	getBlankLines() {
		return this.blankLines;
	}
	peek() {
		return this.lines[this.index];
	}
	next() {
		return this.lines[this.index++];
	}
	current() {
		return this.index > 0 ? this.lines[this.index - 1] : void 0;
	}
	advance() {
		this.index++;
	}
	atEnd() {
		return this.index >= this.lines.length;
	}
	get length() {
		return this.lines.length;
	}
	peekAtDepth(targetDepth) {
		const line = this.peek();
		return line?.depth === targetDepth ? line : void 0;
	}
};
function toParsedLines(source, indentSize, strict) {
	if (!source.trim()) return {
		lines: [],
		blankLines: []
	};
	const lines = source.split("\n");
	const parsed = [];
	const blankLines = [];
	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		const lineNumber = i + 1;
		let indent = 0;
		while (indent < raw.length && raw[indent] === SPACE) indent++;
		const content = raw.slice(indent);
		if (!content.trim()) {
			const depth$1 = computeDepthFromIndent(indent, indentSize);
			blankLines.push({
				lineNumber,
				indent,
				depth: depth$1
			});
			continue;
		}
		const depth = computeDepthFromIndent(indent, indentSize);
		if (strict) {
			let whitespaceEndIndex = 0;
			while (whitespaceEndIndex < raw.length && (raw[whitespaceEndIndex] === SPACE || raw[whitespaceEndIndex] === TAB)) whitespaceEndIndex++;
			if (raw.slice(0, whitespaceEndIndex).includes(TAB)) throw new SyntaxError(`Line ${lineNumber}: Tabs are not allowed in indentation in strict mode`);
			if (indent > 0 && indent % indentSize !== 0) throw new SyntaxError(`Line ${lineNumber}: Indentation must be exact multiple of ${indentSize}, but found ${indent} spaces`);
		}
		parsed.push({
			raw,
			indent,
			content,
			depth,
			lineNumber
		});
	}
	return {
		lines: parsed,
		blankLines
	};
}
function computeDepthFromIndent(indentSpaces, indentSize) {
	return Math.floor(indentSpaces / indentSize);
}

//#endregion
//#region src/encode/folding.ts
/**
* Attempts to fold a single-key object chain into a dotted path.
*
* @remarks
* Folding traverses nested objects with single keys, collapsing them into a dotted path.
* It stops when:
* - A non-single-key object is encountered
* - An array is encountered (arrays are not "single-key objects")
* - A primitive value is reached
* - The flatten depth limit is reached
* - Any segment fails safe mode validation
*
* Safe mode requirements:
* - `options.keyFolding` must be `'safe'`
* - Every segment must be a valid identifier (no dots, no special chars)
* - The folded key must not collide with existing sibling keys
* - No segment should require quoting
*
* @param key - The starting key to fold
* @param value - The value associated with the key
* @param siblings - Array of all sibling keys at this level (for collision detection)
* @param options - Resolved encoding options
* @returns A FoldResult if folding is possible, undefined otherwise
*/
function tryFoldKeyChain(key, value, siblings, options, rootLiteralKeys, pathPrefix, flattenDepth) {
	if (options.keyFolding !== "safe") return;
	if (!isJsonObject(value)) return;
	const { segments, tail, leafValue } = collectSingleKeyChain(key, value, flattenDepth ?? options.flattenDepth);
	if (segments.length < 2) return;
	if (!segments.every((seg) => isIdentifierSegment(seg))) return;
	const foldedKey = buildFoldedKey(segments);
	const absolutePath = pathPrefix ? `${pathPrefix}${DOT}${foldedKey}` : foldedKey;
	if (siblings.includes(foldedKey)) return;
	if (rootLiteralKeys && rootLiteralKeys.has(absolutePath)) return;
	return {
		foldedKey,
		remainder: tail,
		leafValue,
		segmentCount: segments.length
	};
}
/**
* Collects a chain of single-key objects into segments.
*
* @remarks
* Traverses nested objects, collecting keys until:
* - A non-single-key object is found
* - An array is encountered
* - A primitive is reached
* - An empty object is reached
* - The depth limit is reached
*
* @param startKey - The initial key to start the chain
* @param startValue - The value to traverse
* @param maxDepth - Maximum number of segments to collect
* @returns Object containing segments array, tail value, and leaf value
*/
function collectSingleKeyChain(startKey, startValue, maxDepth) {
	const segments = [startKey];
	let currentValue = startValue;
	while (segments.length < maxDepth) {
		if (!isJsonObject(currentValue)) break;
		const keys = Object.keys(currentValue);
		if (keys.length !== 1) break;
		const nextKey = keys[0];
		const nextValue = currentValue[nextKey];
		segments.push(nextKey);
		currentValue = nextValue;
	}
	if (!isJsonObject(currentValue) || isEmptyObject(currentValue)) return {
		segments,
		tail: void 0,
		leafValue: currentValue
	};
	return {
		segments,
		tail: currentValue,
		leafValue: currentValue
	};
}
function buildFoldedKey(segments) {
	return segments.join(DOT);
}

//#endregion
//#region src/encode/primitives.ts
function encodePrimitive(value, delimiter) {
	if (value === null) return NULL_LITERAL;
	if (typeof value === "boolean") return String(value);
	if (typeof value === "number") return String(value);
	return encodeStringLiteral(value, delimiter);
}
function encodeStringLiteral(value, delimiter = DEFAULT_DELIMITER) {
	if (isSafeUnquoted(value, delimiter)) return value;
	return `${DOUBLE_QUOTE}${escapeString(value)}${DOUBLE_QUOTE}`;
}
function encodeKey(key) {
	if (isValidUnquotedKey(key)) return key;
	return `${DOUBLE_QUOTE}${escapeString(key)}${DOUBLE_QUOTE}`;
}
function encodeAndJoinPrimitives(values, delimiter = DEFAULT_DELIMITER) {
	return values.map((v) => encodePrimitive(v, delimiter)).join(delimiter);
}
function formatHeader(length, options) {
	const key = options?.key;
	const fields = options?.fields;
	const delimiter = options?.delimiter ?? COMMA;
	let header = "";
	if (key) header += encodeKey(key);
	header += `[${length}${delimiter !== DEFAULT_DELIMITER ? delimiter : ""}]`;
	if (fields) {
		const quotedFields = fields.map((f) => encodeKey(f));
		header += `{${quotedFields.join(delimiter)}}`;
	}
	header += ":";
	return header;
}

//#endregion
//#region src/encode/writer.ts
var LineWriter = class {
	lines = [];
	indentationString;
	constructor(indentSize) {
		this.indentationString = " ".repeat(indentSize);
	}
	push(depth, content) {
		const indent = this.indentationString.repeat(depth);
		this.lines.push(indent + content);
	}
	pushListItem(depth, content) {
		this.push(depth, `${LIST_ITEM_PREFIX}${content}`);
	}
	toString() {
		return this.lines.join("\n");
	}
};

//#endregion
//#region src/encode/encoders.ts
function encodeValue(value, options) {
	if (isJsonPrimitive(value)) return encodePrimitive(value, options.delimiter);
	const writer = new LineWriter(options.indent);
	if (isJsonArray(value)) encodeArray(void 0, value, writer, 0, options);
	else if (isJsonObject(value)) encodeObject(value, writer, 0, options);
	return writer.toString();
}
function encodeObject(value, writer, depth, options, rootLiteralKeys, pathPrefix, remainingDepth) {
	const keys = Object.keys(value);
	if (depth === 0 && !rootLiteralKeys) rootLiteralKeys = new Set(keys.filter((k) => k.includes(".")));
	const effectiveFlattenDepth = remainingDepth ?? options.flattenDepth;
	for (const [key, val] of Object.entries(value)) encodeKeyValuePair(key, val, writer, depth, options, keys, rootLiteralKeys, pathPrefix, effectiveFlattenDepth);
}
function encodeKeyValuePair(key, value, writer, depth, options, siblings, rootLiteralKeys, pathPrefix, flattenDepth) {
	const currentPath = pathPrefix ? `${pathPrefix}${DOT}${key}` : key;
	const effectiveFlattenDepth = flattenDepth ?? options.flattenDepth;
	if (options.keyFolding === "safe" && siblings) {
		const foldResult = tryFoldKeyChain(key, value, siblings, options, rootLiteralKeys, pathPrefix, effectiveFlattenDepth);
		if (foldResult) {
			const { foldedKey, remainder, leafValue, segmentCount } = foldResult;
			const encodedFoldedKey = encodeKey(foldedKey);
			if (remainder === void 0) {
				if (isJsonPrimitive(leafValue)) {
					writer.push(depth, `${encodedFoldedKey}: ${encodePrimitive(leafValue, options.delimiter)}`);
					return;
				} else if (isJsonArray(leafValue)) {
					encodeArray(foldedKey, leafValue, writer, depth, options);
					return;
				} else if (isJsonObject(leafValue) && isEmptyObject(leafValue)) {
					writer.push(depth, `${encodedFoldedKey}:`);
					return;
				}
			}
			if (isJsonObject(remainder)) {
				writer.push(depth, `${encodedFoldedKey}:`);
				const remainingDepth = effectiveFlattenDepth - segmentCount;
				const foldedPath = pathPrefix ? `${pathPrefix}${DOT}${foldedKey}` : foldedKey;
				encodeObject(remainder, writer, depth + 1, options, rootLiteralKeys, foldedPath, remainingDepth);
				return;
			}
		}
	}
	const encodedKey = encodeKey(key);
	if (isJsonPrimitive(value)) writer.push(depth, `${encodedKey}: ${encodePrimitive(value, options.delimiter)}`);
	else if (isJsonArray(value)) encodeArray(key, value, writer, depth, options);
	else if (isJsonObject(value)) {
		writer.push(depth, `${encodedKey}:`);
		if (!isEmptyObject(value)) encodeObject(value, writer, depth + 1, options, rootLiteralKeys, currentPath, effectiveFlattenDepth);
	}
}
function encodeArray(key, value, writer, depth, options) {
	if (value.length === 0) {
		const header = formatHeader(0, {
			key,
			delimiter: options.delimiter
		});
		writer.push(depth, header);
		return;
	}
	if (isArrayOfPrimitives(value)) {
		const arrayLine = encodeInlineArrayLine(value, options.delimiter, key);
		writer.push(depth, arrayLine);
		return;
	}
	if (isArrayOfArrays(value)) {
		if (value.every((arr) => isArrayOfPrimitives(arr))) {
			encodeArrayOfArraysAsListItems(key, value, writer, depth, options);
			return;
		}
	}
	if (isArrayOfObjects(value)) {
		const header = extractTabularHeader(value);
		if (header) encodeArrayOfObjectsAsTabular(key, value, header, writer, depth, options);
		else encodeMixedArrayAsListItems(key, value, writer, depth, options);
		return;
	}
	encodeMixedArrayAsListItems(key, value, writer, depth, options);
}
function encodeArrayOfArraysAsListItems(prefix, values, writer, depth, options) {
	const header = formatHeader(values.length, {
		key: prefix,
		delimiter: options.delimiter
	});
	writer.push(depth, header);
	for (const arr of values) if (isArrayOfPrimitives(arr)) {
		const arrayLine = encodeInlineArrayLine(arr, options.delimiter);
		writer.pushListItem(depth + 1, arrayLine);
	}
}
function encodeInlineArrayLine(values, delimiter, prefix) {
	const header = formatHeader(values.length, {
		key: prefix,
		delimiter
	});
	const joinedValue = encodeAndJoinPrimitives(values, delimiter);
	if (values.length === 0) return header;
	return `${header} ${joinedValue}`;
}
function encodeArrayOfObjectsAsTabular(prefix, rows, header, writer, depth, options) {
	const formattedHeader = formatHeader(rows.length, {
		key: prefix,
		fields: header,
		delimiter: options.delimiter
	});
	writer.push(depth, `${formattedHeader}`);
	writeTabularRows(rows, header, writer, depth + 1, options);
}
function extractTabularHeader(rows) {
	if (rows.length === 0) return;
	const firstRow = rows[0];
	const firstKeys = Object.keys(firstRow);
	if (firstKeys.length === 0) return;
	if (isTabularArray(rows, firstKeys)) return firstKeys;
}
function isTabularArray(rows, header) {
	for (const row of rows) {
		if (Object.keys(row).length !== header.length) return false;
		for (const key of header) {
			if (!(key in row)) return false;
			if (!isJsonPrimitive(row[key])) return false;
		}
	}
	return true;
}
function writeTabularRows(rows, header, writer, depth, options) {
	for (const row of rows) {
		const joinedValue = encodeAndJoinPrimitives(header.map((key) => row[key]), options.delimiter);
		writer.push(depth, joinedValue);
	}
}
function encodeMixedArrayAsListItems(prefix, items, writer, depth, options) {
	const header = formatHeader(items.length, {
		key: prefix,
		delimiter: options.delimiter
	});
	writer.push(depth, header);
	for (const item of items) encodeListItemValue(item, writer, depth + 1, options);
}
function encodeObjectAsListItem(obj, writer, depth, options) {
	if (isEmptyObject(obj)) {
		writer.push(depth, LIST_ITEM_MARKER);
		return;
	}
	const entries = Object.entries(obj);
	const [firstKey, firstValue] = entries[0];
	const encodedKey = encodeKey(firstKey);
	if (isJsonPrimitive(firstValue)) writer.pushListItem(depth, `${encodedKey}: ${encodePrimitive(firstValue, options.delimiter)}`);
	else if (isJsonArray(firstValue)) if (isArrayOfPrimitives(firstValue)) {
		const arrayPropertyLine = encodeInlineArrayLine(firstValue, options.delimiter, firstKey);
		writer.pushListItem(depth, arrayPropertyLine);
	} else if (isArrayOfObjects(firstValue)) {
		const header = extractTabularHeader(firstValue);
		if (header) {
			const formattedHeader = formatHeader(firstValue.length, {
				key: firstKey,
				fields: header,
				delimiter: options.delimiter
			});
			writer.pushListItem(depth, formattedHeader);
			writeTabularRows(firstValue, header, writer, depth + 1, options);
		} else {
			writer.pushListItem(depth, `${encodedKey}[${firstValue.length}]:`);
			for (const item of firstValue) encodeObjectAsListItem(item, writer, depth + 1, options);
		}
	} else {
		writer.pushListItem(depth, `${encodedKey}[${firstValue.length}]:`);
		for (const item of firstValue) encodeListItemValue(item, writer, depth + 1, options);
	}
	else if (isJsonObject(firstValue)) {
		writer.pushListItem(depth, `${encodedKey}:`);
		if (!isEmptyObject(firstValue)) encodeObject(firstValue, writer, depth + 2, options);
	}
	for (let i = 1; i < entries.length; i++) {
		const [key, value] = entries[i];
		encodeKeyValuePair(key, value, writer, depth + 1, options);
	}
}
function encodeListItemValue(value, writer, depth, options) {
	if (isJsonPrimitive(value)) writer.pushListItem(depth, encodePrimitive(value, options.delimiter));
	else if (isJsonArray(value) && isArrayOfPrimitives(value)) {
		const arrayLine = encodeInlineArrayLine(value, options.delimiter);
		writer.pushListItem(depth, arrayLine);
	} else if (isJsonObject(value)) encodeObjectAsListItem(value, writer, depth, options);
}

//#endregion
//#region src/index.ts
/**
* Encodes a JavaScript value into TOON format string.
*
* @param input - Any JavaScript value (objects, arrays, primitives)
* @param options - Optional encoding configuration
* @returns TOON formatted string
*
* @example
* ```ts
* encode({ name: 'Alice', age: 30 })
* // name: Alice
* // age: 30
*
* encode({ users: [{ id: 1 }, { id: 2 }] })
* // users[]:
* //   - id: 1
* //   - id: 2
*
* encode(data, { indent: 4, keyFolding: 'safe' })
* ```
*/
function encode(input, options) {
	return encodeValue(normalizeValue(input), resolveOptions(options));
}
/**
* Decodes a TOON format string into a JavaScript value.
*
* @param input - TOON formatted string
* @param options - Optional decoding configuration
* @returns Parsed JavaScript value (object, array, or primitive)
*
* @example
* ```ts
* decode('name: Alice\nage: 30')
* // { name: 'Alice', age: 30 }
*
* decode('users[]:\n  - id: 1\n  - id: 2')
* // { users: [{ id: 1 }, { id: 2 }] }
*
* decode(toonString, { strict: false, expandPaths: 'safe' })
* ```
*/
function decode(input, options) {
	const resolvedOptions = resolveDecodeOptions(options);
	const scanResult = toParsedLines(input, resolvedOptions.indent, resolvedOptions.strict);
	if (scanResult.lines.length === 0) return {};
	const decodedValue = decodeValueFromLines(new LineCursor(scanResult.lines, scanResult.blankLines), resolvedOptions);
	if (resolvedOptions.expandPaths === "safe") return expandPathsSafe(decodedValue, resolvedOptions.strict);
	return decodedValue;
}
function resolveOptions(options) {
	return {
		indent: options?.indent ?? 2,
		delimiter: options?.delimiter ?? DEFAULT_DELIMITER,
		keyFolding: options?.keyFolding ?? "off",
		flattenDepth: options?.flattenDepth ?? Number.POSITIVE_INFINITY
	};
}
function resolveDecodeOptions(options) {
	return {
		indent: options?.indent ?? 2,
		strict: options?.strict ?? true,
		expandPaths: options?.expandPaths ?? "off"
	};
}

//#endregion
export { DEFAULT_DELIMITER, DELIMITERS, decode, encode };