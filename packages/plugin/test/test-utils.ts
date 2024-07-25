import { defineComponent, h, MaybeRefOrGetter, PropType, resolveDirective, toValue, VNode, vShow, watchEffect, withDirectives } from 'vue';
import { AnnouncementOptions, useAnnouncer, VLiveDirectiveModifiers, VLiveDirectiveValue } from '../src/plugin.js';

export const DummyComponent = defineComponent({
	props: {
		text: { type: String, default: 'Dummy component mounted' },
		type: { type: String as PropType<AnnouncementOptions['type']> },
	},
	setup(props) {
		const announce = useAnnouncer();

		watchEffect(() => {
			if (props.text) {
				announce(props.text, { type: props.type });
			}
		}, { flush: 'post' });

		return () => h('span');
	},
});

// The getters are needed to keep reactivity intact
export function withDirective(vnode: VNode | (() => VNode), { value, arg, modifiers = {} }: { value?: () => VLiveDirectiveValue; arg?: string; modifiers?: Partial<Record<VLiveDirectiveModifiers, boolean>> } = {}, show: MaybeRefOrGetter<boolean> = true) {
	return () => withDirectives(toValue(vnode), [[vShow, toValue(show)], [ resolveDirective('live'), toValue(value), arg, modifiers ]] );
}
