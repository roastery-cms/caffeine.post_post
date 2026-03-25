import { describe, it, beforeEach, expect } from "bun:test";
import { bootstrap } from "../dev/bootstrap";
import { faker } from "@faker-js/faker";
import { treaty } from "@elysiajs/eden";
import { generateUUID } from "@roastery/beans/entity/helpers";
import { PostTag } from "@roastery-capsules/post.post-tag/domain";
import { PostType } from "@roastery-capsules/post.post-type/domain";
import { CreatePostDTO } from "@/application/dtos";
import { Schema } from "@roastery/terroir/schema";

type App = Awaited<ReturnType<typeof bootstrap>>;

const TAG = PostTag.make({ name: "Tech" });
const TYPE = PostType.make({
	name: "Blog",
	schema: Schema.make(CreatePostDTO).toString(),
});

function makeBody(overrides?: Record<string, unknown>) {
	return {
		postTypeId: TYPE.id,
		tags: [TAG.id],
		name: faker.lorem.words(3),
		description: faker.lorem.sentence(),
		cover: faker.image.url(),
		...overrides,
	};
}

describe("DeletePostController", () => {
	let server: App;
	let api: ReturnType<typeof treaty<App>>;
	let env: App["decorator"]["env"];

	beforeEach(async () => {
		server = await bootstrap();
		await (
			server.decorator.cache as unknown as { flushall: () => Promise<void> }
		).flushall();

		// biome-ignore lint/suspicious/noExplicitAny: acesso aos repositórios de teste para seed
		const decorator = server.decorator as any;
		decorator.postTagRepositoryForPost.seed([TAG]);
		decorator.postTypeRepositoryForPost.seed([TYPE]);

		api = treaty<typeof server>(server);
		env = server.decorator.env;
	});

	async function authenticate() {
		const { AUTH_EMAIL: email, AUTH_PASSWORD: password } = env;
		const auth = await api.auth.login.post({ email, password });
		const cookies = auth.response.headers.getSetCookie();
		return { headers: { cookie: cookies.join("; ") } };
	}

	async function createPost(options: { headers: { cookie: string } }) {
		const { data } = await api.posts.post(makeBody(), options);
		return data as { id: string; slug: string };
	}

	it("should delete a post and return 204", async () => {
		const options = await authenticate();
		const created = await createPost(options);

		const { status } = await api
			.posts({ "id-or-slug": created.id })
			.delete({}, options);

		expect(status).toBe(204);
	});

	it("should remove the post from the system after deletion", async () => {
		const options = await authenticate();
		const created = await createPost(options);

		await api.posts({ "id-or-slug": created.id }).delete({}, options);

		const { status } = await api.posts({ "id-or-slug": created.id }).get();
		expect(status).toBe(404);
	});

	it("should reject unauthenticated requests", async () => {
		const options = await authenticate();
		const created = await createPost(options);

		const { status } = await api.posts({ "id-or-slug": created.id }).delete();

		expect(status).not.toBe(204);
	});

	it("should return 404 when the post does not exist", async () => {
		const options = await authenticate();

		const { status } = await api
			.posts({ "id-or-slug": generateUUID() })
			.delete({}, options);

		expect(status).toBe(404);
	});
});
