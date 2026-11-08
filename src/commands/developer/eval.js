/**
 * ╔══════════════════════════════════════╗
 * ║              AYLA EVAL               ║
 * ║                 v1.0                 ║
 * ╚══════════════════════════════════════╝
 */

const path = require("path");
const { createRequire } = require("module");
const { cmd } = require("../../lib/util");

const OWNER_ID = "7401027785";

const rootRequire = createRequire(
    path.join(process.cwd(), "package.json")
);

const AsyncFunction = Object.getPrototypeOf(
    async function () {}
).constructor;

module.exports = function (bot) {
    cmd(bot, ["eval"], async (ctx, args) => {
        if (String(ctx.from.id) !== OWNER_ID) {
            return;
        }

        const code = String(args || "").trim();

        if (!code) {
            return ctx.reply(
                "استخدم:\n.eval كود JavaScript"
            );
        }

        const output = [];

        const out = (...values) => {
            output.push(
                values.map(v =>
                    typeof v === "string"
                        ? v
                        : JSON.stringify(v)
                ).join(" ")
            );
        };

        try {
            const execute = new AsyncFunction(
                "ctx",
                "require",
                "out",
                "bot",
                code
            );

            const result = await execute(
                ctx,
                rootRequire,
                out,
                bot
            );

            if (result !== undefined) {
                out(result);
            }

            return ctx.reply(
                output.length
                    ? output.join("\n").slice(0, 4000)
                    : "✅ تم تنفيذ الكود بنجاح."
            );

        } catch (error) {
            return ctx.reply(
                "❌ خطأ أثناء التنفيذ:\n" +
                String(error.stack || error.message).slice(0, 3500)
            );
        }
    });
};